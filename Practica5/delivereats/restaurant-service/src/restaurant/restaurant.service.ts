import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { RestaurantOrder, RestaurantOrderStatus } from './entities/restaurant-order.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,

    @InjectRepository(MenuItem)
    private menuItemRepo: Repository<MenuItem>,

    @InjectRepository(RestaurantOrder)
    private restaurantOrderRepo: Repository<RestaurantOrder>,

    // Para publicar eventos order.accepted / order.rejected
    private readonly amqpConnection: AmqpConnection,
  ) {}

  //  CRUD para el restaurante 
  async createRestaurant(data: any): Promise<Restaurant> {
    const newRestaurant = this.restaurantRepo.create(data);
    return (await this.restaurantRepo.save(newRestaurant)) as unknown as Restaurant;
  }

  async getRestaurants(): Promise<{ restaurants: Restaurant[] }> {
    const restaurants = await this.restaurantRepo.find();
    return { restaurants };
  }

  async getRestaurant(id: number): Promise<Restaurant> {
    const restaurant = await this.restaurantRepo.findOne({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');
    return restaurant;
  }

  async updateRestaurant(data: any): Promise<Restaurant> {
    const { id, ...updateData } = data;
    await this.restaurantRepo.update(id, updateData);
    return this.getRestaurant(id);
  }

  async deleteRestaurant(id: number): Promise<any> {
    const result = await this.restaurantRepo.delete(id);
    return {
      success: (result.affected || 0) > 0,
      message: (result.affected || 0) > 0 ? 'Restaurante eliminado' : 'Restaurante no encontrado',
    };
  }

  //  CRUD  para menu

  async createMenuItem(data: any): Promise<MenuItem> {
    const restaurant = await this.restaurantRepo.findOne({ where: { id: data.restaurantId } });
    if (!restaurant) throw new NotFoundException('El restaurante no existe');
    const newItem = this.menuItemRepo.create({ ...data, restaurant });
    return (await this.menuItemRepo.save(newItem)) as unknown as MenuItem;
  }

  async getMenu(restaurantId: number): Promise<{ items: MenuItem[] }> {
    const items = await this.menuItemRepo.find({ where: { restaurantId } });
    return { items };
  }

  async updateMenuItem(data: any): Promise<MenuItem> {
    const { id, ...updateData } = data;
    await this.menuItemRepo.update(id, updateData);
    const item = await this.menuItemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Plato no encontrado tras actualizar');
    return item;
  }

  async deleteMenuItem(id: number): Promise<any> {
    const result = await this.menuItemRepo.delete(id);
    return {
      success: (result.affected || 0) > 0,
      message: (result.affected || 0) > 0 ? 'Plato eliminado' : 'Plato no encontrado',
    };
  }

 
  //  GESTIÓN DE ÓRDENES ENTRANTES
  // aqui se Obtienen todas las órdenes que llegaron a este restaurante.
  
  async getIncomingOrders(restaurantId: number): Promise<{ orders: RestaurantOrder[] }> {
    const orders = await this.restaurantOrderRepo.find({
      where: { restaurantId },
      order: { createdAt: 'DESC' },
    });
    return { orders };
  }

  
   // Restaurante ACEPTA la orden.
   // Actualiza el estado 
   // se va al orden.accept y ahi se actuaiza
  
  async acceptOrder(data: { orderId: number; restaurantId: number }): Promise<any> {
    const order = await this.restaurantOrderRepo.findOne({
      where: { orderId: data.orderId, restaurantId: data.restaurantId },
    });

    if (!order) {
      throw new NotFoundException(`Orden #${data.orderId} no encontrada en este restaurante`);
    }
    if (order.status !== RestaurantOrderStatus.PENDING) {
      throw new Error(`La orden #${data.orderId} ya fue procesada (status: ${order.status})`);
    }

    order.status = RestaurantOrderStatus.ACCEPTED;
    await this.restaurantOrderRepo.save(order);

    // Publicar evento para que order-service y notification-service reaccionen
    await this.amqpConnection.publish(
      'delivereats_exchange',
      'order.accepted',
      {
        orderId: data.orderId,
        restaurantId: data.restaurantId,
        userId: order.userId,
        total: Number(order.total),
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success: true,
      message: `Orden #${data.orderId} aceptada exitosamente`,
      orderId: data.orderId,
      status: RestaurantOrderStatus.ACCEPTED,
    };
  }

 // Restaurante RECHAZA la orden.
   // Actuzalia el estado a Rechazada 
   // Publica 'order.rejected' order-service actualiza a fallida
  async rejectOrder(data: {
    orderId: number;
    restaurantId: number;
    reason?: string;
  }): Promise<any> {
    const order = await this.restaurantOrderRepo.findOne({
      where: { orderId: data.orderId, restaurantId: data.restaurantId },
    });

    if (!order) {
      throw new NotFoundException(`Orden #${data.orderId} no encontrada en este restaurante`);
    }
    if (order.status !== RestaurantOrderStatus.PENDING) {
      throw new Error(`La orden #${data.orderId} ya fue procesada (status: ${order.status})`);
    }

    order.status = RestaurantOrderStatus.REJECTED;
    order.rejectionReason = data.reason || 'Rechazado por el restaurante';
    await this.restaurantOrderRepo.save(order);

    // Publicar evento para que order-service y notification-service reaccionen
    await this.amqpConnection.publish(
      'delivereats_exchange',
      'order.rejected',
      {
        orderId: data.orderId,
        restaurantId: data.restaurantId,
        userId: order.userId,
        reason: order.rejectionReason,
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success: true,
      message: `Orden #${data.orderId} rechazada`,
      orderId: data.orderId,
      status: RestaurantOrderStatus.REJECTED,
      reason: order.rejectionReason,
    };
  }
}