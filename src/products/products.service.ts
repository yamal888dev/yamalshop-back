import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

/** รูปแบบ product ที่ส่งออก API (images/tags เป็น array — ตรงกับ frontend) */
export interface ProductDto extends Omit<Product, 'images' | 'tags'> {
  images: string[];
  tags: string[];
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseJson(value: string): string[] {
    try {
      const arr = JSON.parse(value);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  /** แปลงจาก DB (images/tags เป็น JSON string) เป็นรูปแบบ API */
  private toDto(p: Product): ProductDto {
    return { ...p, images: this.parseJson(p.images), tags: this.parseJson(p.tags) };
  }

  private slugify(name: string): string {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
    return `${base || 'item'}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  async findAll(query: QueryProductsDto): Promise<ProductDto[]> {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      const category = await this.prisma.category.findUnique({
        where: { slug: query.category },
      });
      // ถ้าไม่พบหมวดหมู่ให้คืน list ว่าง
      if (!category) return [];
      where.categoryId = category.id;
    }

    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { name: { contains: term } },
        { brand: { contains: term } },
        { tags: { contains: term } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (query.sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      default:
        orderBy = { rating: 'desc' };
    }

    const products = await this.prisma.product.findMany({ where, orderBy });
    return products.map((p) => this.toDto(p));
  }

  async findFeatured(limit = 8): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      orderBy: { rating: 'desc' },
      take: limit,
    });
    return products.map((p) => this.toDto(p));
  }

  async findBySlug(slug: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({ where: { slug } });
    if (!product) throw new NotFoundException('ไม่พบสินค้า');
    return this.toDto(product);
  }

  async findById(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('ไม่พบสินค้า');
    return this.toDto(product);
  }

  async create(dto: CreateProductDto): Promise<ProductDto> {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        slug: this.slugify(dto.name),
        description: dto.description?.trim() ?? '',
        price: dto.price,
        salePrice: dto.salePrice ?? null,
        categoryId: dto.categoryId,
        images: JSON.stringify(dto.images),
        tags: JSON.stringify(dto.tags ?? []),
        rating: dto.rating ?? 5,
        reviewCount: dto.reviewCount ?? 0,
        stock: dto.stock,
        brand: dto.brand.trim() || 'ไม่ระบุ',
      },
    });
    return this.toDto(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDto> {
    await this.findById(id); // โยน 404 ถ้าไม่มี

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.brand !== undefined) data.brand = dto.brand.trim();
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.salePrice !== undefined) data.salePrice = dto.salePrice;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.reviewCount !== undefined) data.reviewCount = dto.reviewCount;
    if (dto.images !== undefined) data.images = JSON.stringify(dto.images);
    if (dto.tags !== undefined) data.tags = JSON.stringify(dto.tags);
    if (dto.categoryId !== undefined) {
      data.category = { connect: { id: dto.categoryId } };
    }

    const product = await this.prisma.product.update({ where: { id }, data });
    return this.toDto(product);
  }

  async setStock(id: string, stock: number): Promise<ProductDto> {
    await this.findById(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { stock: Math.max(0, Math.floor(stock)) },
    });
    return this.toDto(product);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.findById(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}
