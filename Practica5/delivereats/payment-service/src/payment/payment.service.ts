// payment-service/src/payment/payment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
  ) {}

  // ── 1. Procesar pago simulado ─────────────────────────────
  async processPayment(data: any): Promise<Payment> {
    const { orderId, userId, amount, method, cardLastFour, cardHolder, walletAlias } = data;

    // Simular procesamiento — 95% éxito, 5% fallo
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

    return await this.paymentRepo.save(payment);
  }

  // ── 2. Obtener pago por orden ─────────────────────────────
  async getPaymentByOrder(orderId: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { orderId } });
    if (!payment) throw new NotFoundException(`Pago no encontrado para orden ${orderId}`);
    return payment;
  }

  // ── 3. Aprobar reembolso (admin) ──────────────────────────
  async approveRefund(orderId: number): Promise<Payment> {
    const payment = await this.getPaymentByOrder(orderId);

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error('Este pago ya fue reembolsado');
    }

    payment.status = PaymentStatus.REFUNDED;
    return await this.paymentRepo.save(payment);
  }

  // ── 4. Listar todos los pagos (admin) ─────────────────────
  async getAllPayments(): Promise<{ payments: Payment[] }> {
    const payments = await this.paymentRepo.find({
      order: { createdAt: 'DESC' },
    });
    return { payments };
  }

  // ── 5. Obtener pago por ID ────────────────────────────────
  async getPayment(id: number): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return payment;
  }

  // Genera un código de transacción simulado
  private generateTransactionCode(): string {
    return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
