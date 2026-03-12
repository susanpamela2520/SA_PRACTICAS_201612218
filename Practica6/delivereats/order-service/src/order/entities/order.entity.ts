import {
  Entity, Column, PrimaryGeneratedColumn,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum PaymentStatus {
  UNPAID    = 'UNPAID',
  PAID      = 'PAID',
  REFUNDED  = 'REFUNDED',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  restaurantId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  // PENDING → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED | FAILED
  @Column({ default: 'PENDING' })
  status: string;

  // NUEVO: estado del pago
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  // NUEVO: foto Base64 que sube el repartidor (solo al marcar DELIVERED)
  @Column({ type: 'text', nullable: true })
  deliveryPhoto: string;

  // NUEVO: razón de fallo (cuando status = FAILED)
  @Column({ nullable: true })
  deliveryFailedReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
