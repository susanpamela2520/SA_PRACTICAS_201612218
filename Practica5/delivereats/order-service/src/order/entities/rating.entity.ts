import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  userId: number;

  @Column()
  restaurantId: number;

  @Column({ nullable: true })
  repartidorId: number;

  @Column({ type: 'int', nullable: true })
  ratingRestaurant: number;

  @Column({ type: 'int', nullable: true })
  ratingDelivery: number;

  @Column({ type: 'int', nullable: true })
  ratingProduct: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
