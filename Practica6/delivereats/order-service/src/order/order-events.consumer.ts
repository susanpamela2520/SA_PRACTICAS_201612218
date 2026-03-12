// Aqui se escucha cuando el restaurante acepta o rechaza una orden.
// Actualiza el status en la BD del order-service

import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';


//Se crean las interaces para los eventos que se consumen en Rabbit
//Aceptar
interface OrderAcceptedEvent {
  orderId: number;
  restaurantId: number;
  timestamp: string;
}

//Se crean las interaces para los eventos que se consumen en Rabbit
// Rechazar
interface OrderRejectedEvent {
  orderId: number;
  restaurantId: number;
  userId: number;
  reason: string;
  timestamp: string;
}

@Injectable()
export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // Aqui el  Restaurante ACEPTÓ la orden
  @RabbitSubscribe({
    exchange: 'delivereats_exchange',
    routingKey: 'order.accepted',
    queue: 'order_accepted_queue',
    queueOptions: { durable: true },
  })
  async handleOrderAccepted(message: OrderAcceptedEvent): Promise<void> {
    this.logger.log(`[ORDER-SERVICE] Restaurante aceptó orden #${message.orderId}`);
    try {
      const order = await this.orderRepo.findOne({ where: { id: message.orderId } });
      if (!order) {
        this.logger.warn(`Orden #${message.orderId} no encontrada en order-service`);
        return;
      }
      order.status = 'PREPARING';
      await this.orderRepo.save(order);
      this.logger.log(`[ORDER-SERVICE] Orden #${message.orderId}  PREPARING `);
    } catch (error) {
      this.logger.error(`Error actualizando orden aceptada: ${error.message}`);
    }
  }

  //  aqui el restaurante rechaza la orden fallido 
  @RabbitSubscribe({
    exchange: 'delivereats_exchange',
    routingKey: 'order.rejected',
    queue: 'order_rejected_queue',
    queueOptions: { durable: true },
  })
  async handleOrderRejected(message: OrderRejectedEvent): Promise<void> {
    this.logger.log(`[ORDER-SERVICE] Restaurante rechazó orden #${message.orderId}. Razón: ${message.reason}`);
    try {
      const order = await this.orderRepo.findOne({ where: { id: message.orderId } });
      if (!order) {
        this.logger.warn(`Orden #${message.orderId} no encontrada en order-service`);
        return;
      }
      order.status = 'FAILED';
      order.deliveryFailedReason = message.reason || 'Rechazado por el restaurante';
      await this.orderRepo.save(order);
      this.logger.log(`[ORDER-SERVICE] Orden #${message.orderId}  FAILED`);
    } catch (error) {
      this.logger.error(`Error actualizando orden rechazada: ${error.message}`);
    }
  }
}