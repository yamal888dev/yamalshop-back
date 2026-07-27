import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './jwt.strategy';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private sign(user: User) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.sign(payload);
  }

  /** ตัด password ออกก่อนส่งกลับ client */
  private sanitize(user: User) {
    const { password: _pw, ...rest } = user;
    void _pw;
    return rest;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('อีเมลนี้ถูกใช้สมัครแล้ว');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone: dto.phone?.trim() || null,
        password: hash,
        role: 'customer',
      },
    });

    return { user: this.sanitize(user), accessToken: this.sign(user) };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    return { user: this.sanitize(user), accessToken: this.sign(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('ไม่พบผู้ใช้');
    return this.sanitize(user);
  }
}
