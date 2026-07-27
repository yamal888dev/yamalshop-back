import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** ต้องแนบ Bearer token ที่ถูกต้อง */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
