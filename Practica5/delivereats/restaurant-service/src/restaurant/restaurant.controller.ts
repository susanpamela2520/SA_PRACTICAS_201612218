// restaurant-service/src/restaurant.controller.ts
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RestaurantService } from './restaurant.service';

@Controller()
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

 
  //  CRUD para RESTAURANTES

  @GrpcMethod('RestaurantService', 'CreateRestaurant')
  createRestaurant(data: any) {
    return this.restaurantService.createRestaurant(data);
  }

  @GrpcMethod('RestaurantService', 'GetRestaurants')
  getRestaurants() {
    return this.restaurantService.getRestaurants();
  }

  @GrpcMethod('RestaurantService', 'GetRestaurant')
  getRestaurant(data: { id: number }) {
    return this.restaurantService.getRestaurant(data.id);
  }

  @GrpcMethod('RestaurantService', 'UpdateRestaurant')
  updateRestaurant(data: any) {
    return this.restaurantService.updateRestaurant(data);
  }

  @GrpcMethod('RestaurantService', 'DeleteRestaurant')
  deleteRestaurant(data: { id: number }) {
    return this.restaurantService.deleteRestaurant(data.id);
  }

  //  CRUD  para menu
 
  @GrpcMethod('RestaurantService', 'CreateMenuItem')
  createMenuItem(data: any) {
    return this.restaurantService.createMenuItem(data);
  }

  @GrpcMethod('RestaurantService', 'GetMenu')
  getMenu(data: { restaurantId: number }) {
    return this.restaurantService.getMenu(data.restaurantId);
  }

  @GrpcMethod('RestaurantService', 'UpdateMenuItem')
  updateMenuItem(data: any) {
    return this.restaurantService.updateMenuItem(data);
  }

  @GrpcMethod('RestaurantService', 'DeleteMenuItem')
  deleteMenuItem(data: { id: number }) {
    return this.restaurantService.deleteMenuItem(data.id);
  }
 
// Gestion para las ordenes 
// El restaurante recibe las ordenes entrantes y las llamada desde
// elfrontend por medio del api-gateway
  
  @GrpcMethod('RestaurantService', 'GetIncomingOrders')
  getIncomingOrders(data: { restaurantId: number }) {
    return this.restaurantService.getIncomingOrders(data.restaurantId);
  }

  // Restaurante Acepta la orden.
  // actualiza de aceptada 
  //publica order.accepted
  @GrpcMethod('RestaurantService', 'AcceptOrder')
  acceptOrder(data: { orderId: number; restaurantId: number }) {
    return this.restaurantService.acceptOrder(data);
  }

  // restaurante rechaza la orden 
  // actualiza 
  // publica en order.rejected
  
  @GrpcMethod('RestaurantService', 'RejectOrder')
  rejectOrder(data: { orderId: number; restaurantId: number; reason?: string }) {
    return this.restaurantService.rejectOrder(data);
  }
}