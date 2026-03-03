// api-gateway/src/payment.controller.ts — ARCHIVO NUEVO
import {
  Controller, Get, Post, Body,
  Param, Inject, OnModuleInit, UseGuards, Req,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

interface PaymentServiceClient {
  processPayment(data: any): any;
  getPaymentByOrder(data: any): any;
  approveRefund(data: any): any;
  getAllPayments(data: any): any;
}

@Controller('payments')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentController implements OnModuleInit {
  private paymentService: PaymentServiceClient;

  constructor(@Inject('PAYMENT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentServiceClient>('PaymentService');
  }

  // Cliente procesa su pago
  @Post()
  @Roles('Cliente')
  async processPayment(@Req() req: any, @Body() body: any) {
    return this.paymentService.processPayment({
      ...body,
      userId: req.user.userId,
    });
  }

  // Ver pago de una orden
  @Get('order/:orderId')
  async getByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentByOrder({ orderId: Number(orderId) });
  }
}
