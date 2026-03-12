import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantOrder, RestaurantOrderStatus } from './restaurant/entities/restaurant-order.entity';

interface OrderCreatedEvent {
  orderId: number;
  restaurantId: number;
  userId: number;
  total: number;
  items: { menuItemId: number; quantity: number; price: number }[];
  correlationId: string;
  timestamp: string;
}

@Injectable()
export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(
    @InjectRepository(RestaurantOrder)
    private restaurantOrderRepo: Repository<RestaurantOrder>,
  ) {}

  @RabbitSubscribe({
    exchange: 'delivereats_exchange',
    routingKey: 'order.created',
    queue: 'restaurant_order_queue',
    queueOptions: { durable: true },
  })
  async handleOrderCreated(message: OrderCreatedEvent): Promise<void> {
    this.logger.log('─'.repeat(55));
    this.logger.log(`[RESTAURANT] Nueva orden en cola: #${message.orderId}`);
    this.logger.log(`  restaurantId: ${message.restaurantId}`);
    this.logger.log(`  userId:       ${message.userId}`);
    this.logger.log(`  total:        Q${Number(message.total).toFixed(2)}`);

    try {
      // Idempotencia: evitar duplicados si el mensaje se reprocesa
      const exists = await this.restaurantOrderRepo.findOne({
        where: { orderId: message.orderId },
      });
      if (exists) {
        this.logger.warn(`Orden #${message.orderId} ya existe, ignorando duplicado`);
        return;
      }

      const newOrder = this.restaurantOrderRepo.create({
        orderId: message.orderId,
        restaurantId: message.restaurantId,
        userId: message.userId,
        total: message.total,
        items: message.items || [],
        status: RestaurantOrderStatus.PENDING,
      });

      await this.restaurantOrderRepo.save(newOrder);
      this.logger.log(`[RESTAURANT] ✓ Orden #${message.orderId} guardada. Esperando acción del restaurante.`);
    } catch (error) {
      this.logger.error(`[RESTAURANT] Error procesando orden: ${error.message}`);
    }
    this.logger.log('─'.repeat(55));
  }
}