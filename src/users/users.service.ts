import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** รายชื่อสมาชิกทั้งหมด พร้อมสรุปจำนวนออเดอร์และยอดซื้อ (ไม่รวมออเดอร์ที่ยกเลิก) */
  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        orders: {
          where: { status: { not: 'cancelled' } },
          select: { total: true },
        },
      },
    });

    return users.map((u) => {
      const orderCount = u.orders.length;
      const totalSpend = u.orders.reduce((sum, o) => sum + o.total, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
        orderCount,
        totalSpend,
      };
    });
  }
}
