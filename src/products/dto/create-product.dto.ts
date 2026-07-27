import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  brand!: string;

  @IsString()
  categoryId!: string;

  @IsNumber()
  @IsPositive({ message: 'ราคาต้องมากกว่า 0' })
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsInt()
  reviewCount?: number;
}
