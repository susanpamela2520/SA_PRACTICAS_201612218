// payment-service/src/payment/entities/payment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentStatus {
  PENDING   = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED    = 'FAILED',
  REFUNDED  = 'REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD  = 'CREDIT_CARD',
  DEBIT_CARD   = 'DEBIT_CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  userId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  // Datos de tarjeta (solo últimos 4 dígitos — nunca el número completo)
  @Column({ nullable: true })
  cardLastFour: string;

  @Column({ nullable: true })
  cardHolder: string;

  // Para cartera digital
  @Column({ nullable: true })
  walletAlias: string;

  // Código de transacción simulado
  @Column({ nullable: true })
  transactionCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
