import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateIssueDto, UpdateStatusDto } from './dto/order-actions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@Controller('orders')
@UseGuards(JwtAuthGuard) // ทุก endpoint ต้องล็อกอิน
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.orders.findMine(user.id);
  }

  // ===== Admin =====

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('admin')
  stats() {
    return this.orders.stats();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll(@Query('status') status?: string) {
    return this.orders.findAll(status);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.updateStatus(id, dto.status, dto.note);
  }

  @Patch(':id/issues/:issueId/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  resolveIssue(@Param('id') id: string, @Param('issueId') issueId: string) {
    return this.orders.resolveIssue(id, issueId);
  }

  // ===== เจ้าของออเดอร์ =====

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.findOne(id, user);
  }

  @Post(':id/pay')
  markSlip(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.markSlipUploaded(id, user);
  }

  @Post(':id/received')
  confirmReceived(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.orders.confirmReceived(id, user);
  }

  @Post(':id/issues')
  addIssue(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateIssueDto,
  ) {
    return this.orders.addIssue(id, user, dto);
  }
}
