// ============================================================
// notification-service/src/notification.consumer.ts
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

interface OrderCreatedEvent {
  orderId: number;
  restaurantId: number;
  userId: number;
  total: number;
  items: {
    menuItemId: number;
    quantity: number;
    price: number;
  }[];
  correlationId: string;
  timestamp: string;
}

@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  /**
   * Cola separada del restaurant-service para que ambos
   * reciban el MISMO mensaje de forma independiente.
   * RabbitMQ entregará el mensaje a CADA cola suscrita.
   */
  @RabbitSubscribe({
    exchange: 'delivereats_exchange',
    routingKey: 'order.created',
    queue: 'notification_order_queue',
    queueOptions: {
      durable: true,
    },
  })
  async handleOrderCreated(message: OrderCreatedEvent): Promise<void> {
    this.logger.log('─'.repeat(55));
    this.logger.log('[NOTIFICATION] Procesando notificación de nueva orden');
    this.logger.log(`  Para userId:    ${message.userId}`);
    this.logger.log(`  orderId:        ${message.orderId}`);
    this.logger.log(`  Total:          Q${Number(message.total).toFixed(2)}`);
    this.logger.log(`  correlationId:  ${message.correlationId}`);

    // Simula el envío de notificación al usuario
    await this.sendNotification(message);
  }

  private async sendNotification(event: OrderCreatedEvent): Promise<void> {
    // FASE 2 PoC: solo log en consola
    // FASE 3: integrar con servicio de emails / push notifications
    this.logger.log(
      `[NOTIFICATION SENT] ` +
        `Orden #${event.orderId} confirmada. ` +
        `Total: Q${Number(event.total).toFixed(2)}. ` +
        `Usuario: ${event.userId}`,
    );
    this.logger.log('─'.repeat(55));
  }
}
