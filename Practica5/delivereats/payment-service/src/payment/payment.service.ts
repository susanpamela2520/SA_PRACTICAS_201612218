import { Injectable, NotFoundException, Inject, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { lastValueFrom } from 'rxjs';

interface OrderServiceClient {
  updatePaymentStatus(data: any): any;
}

@Injectable()
export class PaymentService implements OnModuleInit {
  private orderService: OrderServiceClient;

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @Inject('ORDER_SERVICE') private orderClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderService = this.orderClient.getService<OrderServiceClient>('OrderService');
  }

  async processPayment(data: any): Promise<Payment> {
    const { orderId, userId, amount, method, cardLastFour, cardHolder, walletAlias } = data;

    const isApproved = Math.random() > 0.05;

    const payment = this.paymentRepo.create({
      orderId,
      userId,
      amount,
      method: method as PaymentMethod,
      status: isApproved ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
      cardLastFour: cardLastFour || null,
      cardHolder: cardHolder || null,
      walletAlias: walletAlias || null,
      transactionCode: isApproved ? this.generateTransactionCode() : null,
    });

    const saved = await this.paymentRepo.save(payment);

    // Notificar al order-service para actualizar paymentStatus
    try {
      await lastValueFrom(this.orderService.updatePaymentStatus({
        orderId: Number(orderId),
        paymentStatus: isApproved ? 'PAID' : 'UNPAID',
      }));
    } catch (e) {
      console.error('Error updating order payment status:', e.message);
    }

    return saved;
  }

  async getPaymentByOrder(orderId: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { orderId } });
    if (!payment) throw new NotFoundException(`Pago no encontrado para orden ${orderId}`);
    return payment;
  }

  async approveRefund(orderId: number): Promise<Payment> {
    const payment = await this.getPaymentByOrder(orderId);
    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error('Este pago ya fue reembolsado');
    }
    payment.status = PaymentStatus.REFUNDED;

    // Actualizar orden a REFUNDED
    try {
      await lastValueFrom(this.orderService.updatePaymentStatus({
        orderId: Number(orderId),
        paymentStatus: 'REFUNDED',
      }));
    } catch (e) {
      console.error('Error updating order refund status:', e.message);
    }

    return await this.paymentRepo.save(payment);
  }

  async getAllPayments(): Promise<{ payments: Payment[] }> {
    const payments = await this.paymentRepo.find({ order: { createdAt: 'DESC' } });
    return { payments };
  }

  async getPayment(id: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }

  private generateTransactionCode(): string {
    return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}