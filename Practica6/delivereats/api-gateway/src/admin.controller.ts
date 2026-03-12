// api-gateway/src/admin.controller.ts — REEMPLAZAR
import {
  Controller, Get, Post,
  Param, Inject, OnModuleInit, UseGuards,
  HttpException, HttpStatus,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { lastValueFrom } from 'rxjs';

interface OrderServiceClient {
  getFinishedOrders(data: any): any;
}

interface PaymentServiceClient {
  approveRefund(data: any): any;
  getAllPayments(data: any): any;
}

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('Administrador')
export class AdminController implements OnModuleInit {
  private orderService: OrderServiceClient;
  private paymentService: PaymentServiceClient;

  constructor(
    @Inject('ORDER_SERVICE') private orderClient: ClientGrpc,
    @Inject('PAYMENT_SERVICE') private paymentClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderService = this.orderClient.getService<OrderServiceClient>('OrderService');
    this.paymentService = this.paymentClient.getService<PaymentServiceClient>('PaymentService');
  }

  @Get('orders/finished')
  async getFinishedOrders() {
    return this.orderService.getFinishedOrders({});
  }

  @Post('orders/:orderId/refund')
  async approveRefund(@Param('orderId') orderId: string) {
    try {
      return await lastValueFrom(
        this.paymentService.approveRefund({ orderId: Number(orderId) })
      );
    } catch (err) {
      // Si no hay pago registrado, igual marcamos la orden como reembolsada
      throw new HttpException(
        'No se encontró pago para esta orden. El reembolso no aplica.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}