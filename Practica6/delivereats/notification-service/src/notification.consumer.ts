// notification-service/src/notification.consumer.ts
import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

// ── Interfaces de eventos ──────────────────────────────────────

interface OrderCreatedEvent {
  orderId: number;
  restaurantId: number;
  userId: number;
  total: number;
  items: { menuItemId: number; quantity: number; price: number }[];
  correlationId: string;
  timestamp: string;
}

interface OrderAcceptedEvent {
  orderId: number;
  restaurantId: number;
  userId: number;
  total: number;
  timestamp: string;
}

interface OrderRejectedEvent {
  orderId: number;
  restaurantId: number;
  userId: number;
  reason: string;
  timestamp: string;
}

@Injectable()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  // ── 1. Orden creada → notificar al cliente que se recibió ──
  @RabbitSubscribe({
    exchange: 'delivereats_exchange',
    routingKey: 'order.created',
    queue: 'notification_order_queue',
    queueOptions: { durable: true },
  })
  async handleOrderCreated(message: OrderCreatedEvent): Promise<void> {
    this.logger.log('─'.repeat(55));
    this.logger.log('[NOTIFICATION] Nueva orden creada');
    this.logger.log(`  Para userId:   ${message.userId}`);
    this.logger.log(`  orderId:       ${message.orderId}`);
    this.logger.log(`  Total:         Q${Number(message.total).toFixed(2)}`);

    // FASE 2 PoC: solo log en consola
    // PRODUCCIÓN: enviar push notification / email al cliente
    this.logger.log(
      `[NOTIF → CLIENTE] Tu orden #${message.orderId} fue recibida. ` +
      `Esperando confirmación del restaurante...`,
    );
    this.logger.log('─'.repeat(55));
  }

  // ── 2. Orden aceptada → notificar a repartidores disponibles ──
  @RabbitSubscribe({
    exchange: 'delivereats_exchange',
    routingKey: 'order.accepted',
    queue: 'notification_order_accepted_queue',
    queueOptions: { durable: true },
  })
  async handleOrderAccepted(message: OrderAcceptedEvent): Promise<void> {
    this.logger.log('─'.repeat(55));
    this.logger.log('[NOTIFICATION] Orden aceptada por restaurante');
    this.logger.log(`  orderId:       ${message.orderId}`);
    this.logger.log(`  restaurantId:  ${message.restaurantId}`);
    this.logger.log(`  userId:        ${message.userId}`);

    // FASE 2 PoC: solo log
    // PRODUCCIÓN: push notification al cliente + broadcast a repartidores disponibles
    this.logger.log(
      `[NOTIF → CLIENTE]     Orden #${message.orderId} ACEPTADA. ¡Tu comida está siendo preparada!`,
    );
    this.logger.log(
      `[NOTIF → REPARTIDORES] Nueva orden #${message.orderId} lista para recoger en restaurante ${message.restaurantId}.`,
    );
    this.logger.log('─'.repeat(55));
  }

  // ── 3. Orden rechazada → notificar al cliente ──────────────
  @RabbitSubscribe({
    exchange: 'delivereats_exchange',
    routingKey: 'order.rejected',
    queue: 'notification_order_rejected_queue',
    queueOptions: { durable: true },
  })
  async handleOrderRejected(message: OrderRejectedEvent): Promise<void> {
    this.logger.log('─'.repeat(55));
    this.logger.log('[NOTIFICATION] Orden rechazada por restaurante');
    this.logger.log(`  orderId:  ${message.orderId}`);
    this.logger.log(`  userId:   ${message.userId}`);
    this.logger.log(`  Razón:    ${message.reason}`);

    // FASE 2 PoC: solo log
    // PRODUCCIÓN: push notification / email al cliente con la razón
    this.logger.log(
      `[NOTIF → CLIENTE] Lo sentimos. Tu orden #${message.orderId} fue rechazada. ` +
      `Razón: ${message.reason}`,
    );
    this.logger.log('─'.repeat(55));
  }
}