import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum RestaurantOrderStatus {
  PENDING  = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('restaurant_order')
export class RestaurantOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderId: number;

  @Column()
  restaurantId: number;

  @Column()
  userId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: RestaurantOrderStatus, default: RestaurantOrderStatus.PENDING })
  status: RestaurantOrderStatus;

  @Column({ type: 'jsonb', nullable: true })
  items: { menuItemId: number; quantity: number; price: number }[];

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}