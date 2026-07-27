import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const ORDER_STATUSES = [
  'pending_payment',
  'awaiting_verification',
  'paid',
  'preparing',
  'shipped',
  'completed',
  'cancelled',
] as const;

export class UpdateStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: (typeof ORDER_STATUSES)[number];

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateIssueDto {
  @IsString()
  @MinLength(1)
  topic!: string;

  @IsString()
  @MinLength(1, { message: 'กรุณากรอกรายละเอียดปัญหา' })
  detail!: string;
}
