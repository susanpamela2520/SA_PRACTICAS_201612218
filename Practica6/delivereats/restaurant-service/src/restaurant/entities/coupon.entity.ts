import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';

export type CouponStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

@Entity()
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  restaurantId: number;

  // Código que ingresa el cliente (ej. DESC20)
  @Column({ unique: true })
  code: string;

  // Porcentaje de descuento (ej. 20 = 20%)
  @Column({ type: 'float' })
  discountPercent: number;

  // Fecha de expiración
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  // Límite de usos (null = ilimitado)
  @Column({ nullable: true })
  usageLimit: number;

  @Column({ default: 0 })
  usageCount: number;

  // El admin debe aprobar antes de que el cliente pueda usarlo
  @Column({ default: 'PENDING_APPROVAL' })
  status: CouponStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;
}