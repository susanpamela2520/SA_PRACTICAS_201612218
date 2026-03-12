// api-gateway/src/payment.controller.ts
import {
  Controller, Get, Post, Body,
  Param, Inject, OnModuleInit, UseGuards, Req,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { lastValueFrom } from 'rxjs';

interface PaymentServiceClient {
  processPayment(data: any): any;
  getPaymentByOrder(data: any): any;
  approveRefund(data: any): any;
  getAllPayments(data: any): any;
}

interface OrderServiceClient {
  updatePaymentStatus(data: any): any;
}

@Controller('payments')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentController implements OnModuleInit {
  private paymentService: PaymentServiceClient;
  private orderService: OrderServiceClient;

  constructor(
    @Inject('PAYMENT_SERVICE') private paymentClient: ClientGrpc,
    @Inject('ORDER_SERVICE') private orderClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.paymentService = this.paymentClient.getService<PaymentServiceClient>('PaymentService');
    this.orderService = this.orderClient.getService<OrderServiceClient>('OrderService');
  }

  @Post()
  @Roles('Cliente')
  async processPayment(@Req() req: any, @Body() body: any) {
    const result: any = await lastValueFrom(
      this.paymentService.processPayment({
        ...body,
        userId: req.user.userId,
      })
    );

    try {
      await lastValueFrom(
        this.orderService.updatePaymentStatus({
          orderId: Number(body.orderId),
          paymentStatus: result.status === 'COMPLETED' ? 'PAID' : 'UNPAID',
        })
      );
    } catch (e) {
      console.error('Error updating order payment status:', e.message);
    }

    return result;
  }

  @Get('order/:orderId')
  async getByOrder(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentByOrder({ orderId: Number(orderId) });
  }
}