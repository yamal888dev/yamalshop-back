import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class OrderItemInputDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class ShippingAddressDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsString()
  @MinLength(1)
  address!: string;

  @IsString()
  @MinLength(1)
  district!: string;

  @IsString()
  @MinLength(1)
  province!: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;
}

export const PAYMENT_METHODS = ['credit_card', 'promptpay', 'bank_transfer', 'cod'] as const;

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'ต้องมีสินค้าอย่างน้อย 1 รายการ' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @IsIn(PAYMENT_METHODS)
  paymentMethod!: (typeof PAYMENT_METHODS)[number];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;
}
