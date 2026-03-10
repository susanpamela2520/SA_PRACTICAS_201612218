import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RestaurantService } from './restaurant.service';

@Controller()
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // ── RESTAURANTES ──────────────────────────────────────────
  @GrpcMethod('RestaurantService', 'CreateRestaurant')
  createRestaurant(data: any) { return this.restaurantService.createRestaurant(data); }

  @GrpcMethod('RestaurantService', 'GetRestaurants')
  getRestaurants() { return this.restaurantService.getRestaurants(); }

  @GrpcMethod('RestaurantService', 'GetRestaurant')
  getRestaurant(data: { id: number }) { return this.restaurantService.getRestaurant(data.id); }

  @GrpcMethod('RestaurantService', 'UpdateRestaurant')
  updateRestaurant(data: any) { return this.restaurantService.updateRestaurant(data); }

  @GrpcMethod('RestaurantService', 'DeleteRestaurant')
  deleteRestaurant(data: { id: number }) { return this.restaurantService.deleteRestaurant(data.id); }

  // ── MENÚ ──────────────────────────────────────────────────
  @GrpcMethod('RestaurantService', 'CreateMenuItem')
  createMenuItem(data: any) { return this.restaurantService.createMenuItem(data); }

  @GrpcMethod('RestaurantService', 'GetMenu')
  getMenu(data: { restaurantId: number }) { return this.restaurantService.getMenu(data.restaurantId); }

  @GrpcMethod('RestaurantService', 'UpdateMenuItem')
  updateMenuItem(data: any) { return this.restaurantService.updateMenuItem(data); }

  @GrpcMethod('RestaurantService', 'DeleteMenuItem')
  deleteMenuItem(data: { id: number }) { return this.restaurantService.deleteMenuItem(data.id); }

  // ── ÓRDENES ENTRANTES (NUEVO) ─────────────────────────────
  @GrpcMethod('RestaurantService', 'GetIncomingOrders')
  getIncomingOrders(data: { restaurantId: number }) {
    return this.restaurantService.getIncomingOrders(data.restaurantId);
  }

  @GrpcMethod('RestaurantService', 'AcceptOrder')
  acceptOrder(data: { orderId: number; restaurantId: number }) {
    return this.restaurantService.acceptOrder(data);
  }

  @GrpcMethod('RestaurantService', 'RejectOrder')
  rejectOrder(data: { orderId: number; restaurantId: number; reason?: string }) {
    return this.restaurantService.rejectOrder(data);
  }
}