
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @GrpcMethod('PaymentService', 'ProcessPayment')
  processPayment(data: any) {
    return this.paymentService.processPayment(data);
  }

  @GrpcMethod('PaymentService', 'GetPaymentByOrder')
  getPaymentByOrder(data: { orderId: number }) {
    return this.paymentService.getPaymentByOrder(data.orderId);
  }

  @GrpcMethod('PaymentService', 'ApproveRefund')
  approveRefund(data: { orderId: number }) {
    return this.paymentService.approveRefund(data.orderId);
  }

  @GrpcMethod('PaymentService', 'GetAllPayments')
  getAllPayments(_data: any) {
    return this.paymentService.getAllPayments();
  }
}
