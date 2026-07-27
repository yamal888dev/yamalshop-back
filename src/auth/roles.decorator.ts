import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** จำกัดสิทธิ์ให้เฉพาะ role ที่กำหนด เช่น @Roles('admin') */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
