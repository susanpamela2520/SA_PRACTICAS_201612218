import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // ── 1. Crear orden ────────────────────────────────────────
  async createOrder(data: any): Promise<Order> {
    const { userId, restaurantId, items } = data;

    let totalAmount = 0;
    const orderItems = items.map((item) => {
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

    return await this.orderRepo.save(newOrder);
  }

  // ── 2. Obtener orden por ID ───────────────────────────────
  async getOrder(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  // ── 3. Historial de órdenes del usuario ──────────────────
  async getOrdersByUser(userId: number): Promise<{ orders: Order[] }> {
    const orders = await this.orderRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return { orders };
  }

  // ── 4. Actualizar estado ──────────────────────────────────
  // MODIFICADO: ahora puede recibir foto y razón de fallo
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

  // ── 5. NUEVO: Repartidor sube foto de entrega ─────────────
  // Se llama al marcar el pedido como DELIVERED
  // La foto viene como Base64 string
  async uploadDeliveryPhoto(data: {
    orderId: number;
    photoBase64: string;
  }): Promise<Order> {
    const order = await this.getOrder(data.orderId);

    order.deliveryPhoto = data.photoBase64;
    order.status = 'DELIVERED';

    return await this.orderRepo.save(order);
  }

  // ── 6. NUEVO: Actualizar estado de pago ───────────────────
  // Lo llama el payment-service después de procesar
  async updatePaymentStatus(data: {
    orderId: number;
    paymentStatus: string;
  }): Promise<Order> {
    const order = await this.getOrder(data.orderId);
    order.paymentStatus = data.paymentStatus as PaymentStatus;
    return await this.orderRepo.save(order);
  }

  // ── 7. NUEVO: Órdenes por restaurante ────────────────────
  async getOrdersByRestaurant(restaurantId: number): Promise<{ orders: Order[] }> {
    const orders = await this.orderRepo.find({
      where: { restaurantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return { orders };
  }

  // ── 8. NUEVO: Órdenes finalizadas/fallidas (para admin) ───
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
