import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { randomUUID } from 'crypto';
import { Order, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    // Aqui se usa el AmqpConnection para publicar eventos
    private readonly amqpConnection: AmqpConnection,
  ) {}

 //Crear orden y se publica en RabbitMQ
  async createOrder(data: any): Promise<Order> {
    const { userId, restaurantId, items } = data;

    let totalAmount = 0;
    const orderItems = items.map((item: any) => {
      totalAmount += item.price * item.quantity;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      };
    });

    const newOrder = this.orderRepo.create({
      userId,
      restaurantId,
      total: totalAmount,
      status: 'PENDING',
      items: orderItems,
    });

    const savedOrder = await this.orderRepo.save(newOrder);

    //Publicar evento order.created a RabbitMQ 
    // donde se conecta esta parte en 
    // El restaurant-service y el notification-service, para que se escuche esta cola
    await this.amqpConnection.publish(
      'delivereats_exchange',
      'order.created',
      {
        orderId: savedOrder.id,
        restaurantId: savedOrder.restaurantId,
        userId: savedOrder.userId,
        total: Number(savedOrder.total),
        items: orderItems,
        correlationId: randomUUID(),
        timestamp: new Date().toISOString(),
      },
    );

    return savedOrder;
  }

  // Obtener orden por ID 
  async getOrder(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  // Historial de órdenes del usuario 
  async getOrdersByUser(userId: number): Promise<{ orders: Order[] }> {
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return { orders };
  }

  // Actualizar estado de la orden 
  async updateOrderStatus(data: {
    id: number;
    status: string;
    deliveryFailedReason?: string;
  }): Promise<Order> {
    const order = await this.getOrder(data.id);
    order.status = data.status;
    if (data.deliveryFailedReason) {
      order.deliveryFailedReason = data.deliveryFailedReason;
    }
    return await this.orderRepo.save(order);
  }

  // Repartidor sube foto de entrega y se puedeo poner estado de entregado
  async uploadDeliveryPhoto(data: {
    orderId: number;
    photoBase64: string;
  }): Promise<Order> {
    const order = await this.getOrder(data.orderId);
    order.deliveryPhoto = data.photoBase64;
    order.status = 'DELIVERED';
    return await this.orderRepo.save(order);
  }

  // ── 6. Actualizar estado de pago
  async updatePaymentStatus(data: {
    orderId: number;
    paymentStatus: string;
  }): Promise<Order> {
    const order = await this.getOrder(data.orderId);
    order.paymentStatus = data.paymentStatus as PaymentStatus;
    return await this.orderRepo.save(order);
  }

  // Órdenes por restaurante 
  async getOrdersByRestaurant(restaurantId: number): Promise<{ orders: Order[] }> {
    const orders = await this.orderRepo.find({
      where: { restaurantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return { orders };
  }

  // Órdenes finalizadas/fallidas (solo para admin) 
  async getFinishedOrders(): Promise<{ orders: Order[] }> {
    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.status IN (:...statuses)', {
        statuses: ['DELIVERED', 'FAILED'],
      })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
    return { orders };
  }
}