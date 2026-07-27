import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  q?: string; // คำค้นหา

  @IsOptional()
  @IsString()
  category?: string; // slug ของหมวดหมู่

  @IsOptional()
  @IsIn(['popular', 'newest', 'price-asc', 'price-desc'])
  sort?: 'popular' | 'newest' | 'price-asc' | 'price-desc';
}

export class SetStockDto {
  @IsInt()
  @Min(0)
  stock!: number;
}
