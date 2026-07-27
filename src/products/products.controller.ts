import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto, SetStockDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // ===== Public =====

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.products.findAll(query);
  }

  @Get('featured')
  findFeatured() {
    return this.products.findFeatured(8);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.products.findBySlug(slug);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.products.findById(id);
  }

  // ===== Admin เท่านั้น =====

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  setStock(@Param('id') id: string, @Body() dto: SetStockDto) {
    return this.products.setStock(id, dto.stock);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.products.remove(id);
  }
}
