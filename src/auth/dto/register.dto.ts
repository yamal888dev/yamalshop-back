import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร' })
  name!: string;

  @IsEmail({}, { message: 'อีเมลไม่ถูกต้อง' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  password!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
