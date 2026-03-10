import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RestaurantOrderStatus {
  PENDING  = 'PENDING',   // Recibida pero el restaurante aun no la ha visto
  ACCEPTED = 'ACCEPTED',  // Restaurante si la aceptó
  REJECTED = 'REJECTED',  // Restaurante la rechazó
}

@Entity('restaurant_order')
export class RestaurantOrder {
  @PrimaryGeneratedColumn()
  id: number;

  // ID de la orden 
  @Column({ unique: true })
  orderId: number;

  @Column()
  restaurantId: number;

  @Column()
  userId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: RestaurantOrderStatus,
    default: RestaurantOrderStatus.PENDING,
  })
  status: RestaurantOrderStatus;

  // Items del pedido
  @Column({ type: 'jsonb', nullable: true })
  items: {
    menuItemId: number;
    quantity: number;
    price: number;
  }[];

  // Solo se llena este fluujo el si status rechazado 
  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Aqui que pasa?
// Guarda las órdenes que llegan via RabbitMQ desde el order-service.
// El restaurante ve las ordenes que puedeaceptar/rechazar.
