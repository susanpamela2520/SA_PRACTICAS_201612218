import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';

export type PromotionType = 'percentage' | 'combo';

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  restaurantId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  // 'percentage' = descuento %, 'combo' = combo de productos
  @Column({ default: 'percentage' })
  type: PromotionType;

  // Solo aplica si type === 'percentage'
  @Column({ type: 'float', default: 0 })
  discountPercent: number;

  // Descripción del combo (ej. "Pizza grande especialidad + gaseosa 2L")
  @Column({ nullable: true })
  comboDescription: string;

  // Precio especial del combo (si aplica)
  @Column({ type: 'float', nullable: true })
  comboPrice: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;
}