import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateIssueDto } from './dto/order-actions.dto';
import type { AuthUser } from '../auth/jwt.strategy';

const SHIPPING_FLAT = 40;
const FREE_SHIPPING_MIN = 1000;

// order ที่ดึงพร้อม relations
const orderInclude = {
  items: true,
  issues: { orderBy: { createdAt: 'asc' } },
  statusHistory: { orderBy: { at: 'asc' } },
} as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateOrderId(): string {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${ymd}-${rand}`;
  }

  /** แปลง order (DB) เป็นรูปแบบ API ที่ frontend ใช้ (ที่อยู่เป็น object ซ้อน) */
  private serialize(order: any) {
    return {
      id: order.id,
      userId: order.userId,
      customerName: order.customerName,
      items: order.items.map((it: any) => ({
        productId: it.productId,
        slug: it.slug,
        name: it.name,
        image: it.image,
        price: it.price,
        quantity: it.quantity,
      })),
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      slipUploaded: order.slipUploaded,
      shippingAddress: {
        fullName: order.addrFullName,
        phone: order.addrPhone,
        address: order.addrAddress,
        district: order.addrDistrict,
        province: order.addrProvince,
        postalCode: order.addrPostalCode,
      },
      statusHistory: order.statusHistory.map((s: any) => ({
        status: s.status,
        at: s.at,
        note: s.note ?? undefined,
      })),
      issues: order.issues.map((i: any) => ({
        id: i.id,
        topic: i.topic,
        detail: i.detail,
        status: i.status,
        createdAt: i.createdAt,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async create(user: AuthUser, dto: CreateOrderDto) {
    // ดึงสินค้าจริงจาก DB (ราคา/สต็อกจากฝั่ง server เท่านั้น — กันปลอมราคา)
    const ids = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: ids } } });

    const lines = dto.items.map((line) => {
      const product = products.find((p) => p.id === line.productId);
      if (!product) throw new BadRequestException(`ไม่พบสินค้า ${line.productId}`);
      if (product.stock < line.quantity) {
        throw new BadRequestException(`สินค้า "${product.name}" มีไม่พอ (เหลือ ${product.stock})`);
      }
      const price = product.salePrice ?? product.price;
      return { product, quantity: line.quantity, price };
    });

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const shippingFee = subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FLAT;
    const total = subtotal + shippingFee;

    // สถานะเริ่มต้นตามช่องทางชำระเงิน
    const initialStatus =
      dto.paymentMethod === 'credit_card'
        ? 'paid'
        : dto.paymentMethod === 'cod'
          ? 'preparing'
          : 'pending_payment';

    const addr = dto.shippingAddress;
    const orderId = this.generateOrderId();

    // สร้างออเดอร์ + ตัดสต็อก แบบ transaction
    const order = await this.prisma.$transaction(async (tx) => {
      for (const l of lines) {
        await tx.product.update({
          where: { id: l.product.id },
          data: { stock: { decrement: l.quantity } },
        });
      }

      return tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          customerName: user.name,
          subtotal,
          shippingFee,
          total,
          status: initialStatus,
          paymentMethod: dto.paymentMethod,
          addrFullName: addr.fullName,
          addrPhone: addr.phone,
          addrAddress: addr.address,
          addrDistrict: addr.district,
          addrProvince: addr.province,
          addrPostalCode: addr.postalCode,
          items: {
            create: lines.map((l) => ({
              productId: l.product.id,
              slug: l.product.slug,
              name: l.product.name,
              image: JSON.parse(l.product.images)[0] ?? '',
              price: l.price,
              quantity: l.quantity,
            })),
          },
          statusHistory: {
            create: [{ status: initialStatus }],
          },
        },
        include: orderInclude,
      });
    });

    return this.serialize(order);
  }

  async findMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
    return orders.map((o) => this.serialize(o));
  }

  async findAll(status?: string) {
    const orders = await this.prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
    return orders.map((o) => this.serialize(o));
  }

  private async getOrderOrThrow(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) throw new NotFoundException('ไม่พบคำสั่งซื้อ');
    return order;
  }

  async findOne(id: string, requester: AuthUser) {
    const order = await this.getOrderOrThrow(id);
    if (requester.role !== 'admin' && order.userId !== requester.id) {
      throw new ForbiddenException('ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้');
    }
    return this.serialize(order);
  }

  /** เปลี่ยนสถานะ + บันทึกประวัติ */
  private async transition(id: string, status: string, note?: string) {
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        statusHistory: { create: [{ status, note: note ?? null }] },
      },
      include: orderInclude,
    });
    return this.serialize(updated);
  }

  async updateStatus(id: string, status: string, note?: string) {
    await this.getOrderOrThrow(id);
    return this.transition(id, status, note);
  }

  /** ลูกค้าแจ้งชำระเงิน/แนบสลิป → รอตรวจสอบ */
  async markSlipUploaded(id: string, user: AuthUser) {
    const order = await this.getOrderOrThrow(id);
    if (order.userId !== user.id) throw new ForbiddenException('ไม่มีสิทธิ์');
    if (order.status !== 'pending_payment') {
      throw new BadRequestException('คำสั่งซื้อนี้ไม่ได้อยู่ในสถานะรอชำระเงิน');
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        slipUploaded: true,
        status: 'awaiting_verification',
        statusHistory: {
          create: [{ status: 'awaiting_verification', note: 'แนบสลิปการชำระเงิน' }],
        },
      },
      include: orderInclude,
    });
    return this.serialize(updated);
  }

  /** ลูกค้ายืนยันรับสินค้า (shipped → completed) */
  async confirmReceived(id: string, user: AuthUser) {
    const order = await this.getOrderOrThrow(id);
    if (order.userId !== user.id) throw new ForbiddenException('ไม่มีสิทธิ์');
    if (order.status !== 'shipped') {
      throw new BadRequestException('คำสั่งซื้อยังไม่ได้จัดส่ง');
    }
    return this.transition(id, 'completed', 'ลูกค้ายืนยันรับสินค้า');
  }

  async addIssue(id: string, user: AuthUser, dto: CreateIssueDto) {
    const order = await this.getOrderOrThrow(id);
    if (order.userId !== user.id) throw new ForbiddenException('ไม่มีสิทธิ์');
    await this.prisma.orderIssue.create({
      data: { orderId: id, topic: dto.topic, detail: dto.detail },
    });
    return this.serialize(await this.getOrderOrThrow(id));
  }

  async resolveIssue(orderId: string, issueId: string) {
    const issue = await this.prisma.orderIssue.findUnique({ where: { id: issueId } });
    if (!issue || issue.orderId !== orderId) throw new NotFoundException('ไม่พบเรื่องที่แจ้ง');
    await this.prisma.orderIssue.update({
      where: { id: issueId },
      data: { status: 'resolved' },
    });
    return this.serialize(await this.getOrderOrThrow(orderId));
  }

  /** สรุปตัวเลขสำหรับหน้า admin dashboard */
  async stats() {
    const [orders, productCount, customerCount] = await Promise.all([
      this.prisma.order.findMany({ select: { total: true, status: true } }),
      this.prisma.product.count(),
      this.prisma.user.count({ where: { role: 'customer' } }),
    ]);

    const revenue = orders
      .filter((o) => o.status !== 'cancelled' && o.status !== 'pending_payment')
      .reduce((sum, o) => sum + o.total, 0);
    const pending = orders.filter(
      (o) => o.status === 'pending_payment' || o.status === 'awaiting_verification',
    ).length;

    return {
      revenue,
      orderCount: orders.length,
      productCount,
      customerCount,
      pendingCount: pending,
    };
  }
}
