// payment-service/src/payment/entities/payment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentStatus {
  PENDING   = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED    = 'FAILED',
  REFUNDED  = 'REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD    = 'CREDIT_CARD',
  DEBIT_CARD     = 'DEBIT_CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column({ nullable: true })
  userId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ nullable: true })
  cardLastFour: string;

  @Column({ nullable: true })
  cardHolder: string;

  @Column({ nullable: true })
  walletAlias: string;

  @Column({ nullable: true })
  transactionCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}