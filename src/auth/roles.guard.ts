import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { AuthUser } from './jwt.strategy';

/** ตรวจ role ของผู้ใช้ (ใช้คู่กับ JwtAuthGuard และ @Roles) */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('ต้องมีสิทธิ์ผู้ดูแลระบบ');
    }
    return true;
  }
}
