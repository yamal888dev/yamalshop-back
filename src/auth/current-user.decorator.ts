import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from './jwt.strategy';

/** ดึงผู้ใช้ปัจจุบันจาก request เช่น @CurrentUser() user: AuthUser */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
