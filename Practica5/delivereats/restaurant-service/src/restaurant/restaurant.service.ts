// restaurant-service/src/restaurant/restaurant.service.ts — REEMPLAZAR
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
    private readonly amqpConnection: AmqpConnection,
  ) {}

  // --- CRUD RESTAURANTE ---

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

  // --- FILTROS Y BÚSQUEDA ---

  async getFilteredRestaurants(filters: {
    category?: string;
    sortBy?: string;
    onlyWithPromotion?: boolean;
    search?: string;
  }): Promise<{ restaurants: Restaurant[] }> {
    const qb = this.restaurantRepo.createQueryBuilder('r');

    if (filters.category && filters.category.trim() !== '') {
      qb.andWhere('LOWER(r.category) LIKE LOWER(:category)', {
        category: `%${filters.category}%`,
      });
    }

    if (filters.search && filters.search.trim() !== '') {
      qb.andWhere('LOWER(r.name) LIKE LOWER(:search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.onlyWithPromotion) {
      qb.andWhere('r.hasActivePromotion = true');
    }

    if (filters.sortBy === 'nuevos') {
      qb.orderBy('r.createdAt', 'DESC');
    } else if (filters.sortBy === 'destacados') {
      qb.orderBy('r.totalSales', 'DESC');
    } else if (filters.sortBy === 'mejor_puntuados') {
      qb.orderBy('r.avgRating', 'DESC');
    } else {
      qb.orderBy('r.id', 'ASC');
    }

    const restaurants = await qb.getMany();
    return { restaurants };
  }

  async incrementSales(restaurantId: number): Promise<void> {
    await this.restaurantRepo.increment({ id: restaurantId }, 'totalSales', 1);
  }

  // --- CRUD MENÚ ---

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

  // --- ÓRDENES ENTRANTES ---

  async getIncomingOrders(restaurantId: number): Promise<{ orders: RestaurantOrder[] }> {
    const orders = await this.restaurantOrderRepo.find({
      where: { restaurantId },
      order: { createdAt: 'DESC' },
    });
    return { orders };
  }

  async acceptOrder(orderId: number): Promise<{ success: boolean; message: string }> {
    const order = await this.restaurantOrderRepo.findOne({ where: { orderId } });
    if (!order) throw new NotFoundException(`Orden #${orderId} no encontrada`);

    order.status = RestaurantOrderStatus.ACCEPTED;  // ← enum correcto
    await this.restaurantOrderRepo.save(order);

    await this.incrementSales(order.restaurantId);

    await this.amqpConnection.publish('delivereats_exchange', 'order.accepted', {
      orderId,
      restaurantId: order.restaurantId,
    });

    console.log(`[RESTAURANT] Restaurante aceptó orden #${orderId}`);
    return { success: true, message: `Orden #${orderId} aceptada` };
  }

  async rejectOrder(orderId: number, reason: string): Promise<{ success: boolean; message: string }> {
    const order = await this.restaurantOrderRepo.findOne({ where: { orderId } });
    if (!order) throw new NotFoundException(`Orden #${orderId} no encontrada`);

    order.status = RestaurantOrderStatus.REJECTED;  // ← enum correcto
    order.rejectionReason = reason;
    await this.restaurantOrderRepo.save(order);

    await this.amqpConnection.publish('delivereats_exchange', 'order.rejected', {
      orderId,
      restaurantId: order.restaurantId,
      reason,
    });

    console.log(`[RESTAURANT] Restaurante rechazó orden #${orderId}: ${reason}`);
    return { success: true, message: `Orden #${orderId} rechazada` };
  }
}