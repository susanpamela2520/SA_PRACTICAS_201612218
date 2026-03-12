import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  createOrder(data: any) {
    return this.orderService.createOrder(data);
  }

  @GrpcMethod('OrderService', 'GetOrder')
  getOrder(data: { id: number }) {
    return this.orderService.getOrder(data.id);
  }

  @GrpcMethod('OrderService', 'GetOrdersByUser')
  getOrdersByUser(data: { userId: number }) {
    return this.orderService.getOrdersByUser(data.userId);
  }

  @GrpcMethod('OrderService', 'UpdateOrderStatus')
  updateStatus(data: { id: number; status: string; deliveryFailedReason?: string }) {
    return this.orderService.updateOrderStatus(data);
  }

  // NUEVO: repartidor sube foto al entregar
  @GrpcMethod('OrderService', 'UploadDeliveryPhoto')
  uploadDeliveryPhoto(data: { orderId: number; photoBase64: string }) {
    return this.orderService.uploadDeliveryPhoto(data);
  }

  // NUEVO: payment-service notifica que se pagó
  @GrpcMethod('OrderService', 'UpdatePaymentStatus')
  updatePaymentStatus(data: { orderId: number; paymentStatus: string }) {
    return this.orderService.updatePaymentStatus(data);
  }

  // NUEVO: restaurante ve sus propias órdenes
  @GrpcMethod('OrderService', 'GetOrdersByRestaurant')
  getOrdersByRestaurant(data: { restaurantId: number }) {
    return this.orderService.getOrdersByRestaurant(data.restaurantId);
  }

  // NUEVO: admin ve órdenes finalizadas/fallidas para reembolsos
  @GrpcMethod('OrderService', 'GetFinishedOrders')
  getFinishedOrders(_data: any) {
    return this.orderService.getFinishedOrders();
  }

  @GrpcMethod('OrderService', 'GetOrdersByStatus')
  getOrdersByStatus(data: { status: string }) {
    return this.orderService.getOrdersByStatus(data.status);
  }


  //crea el rating de una orden
  @GrpcMethod('OrderService', 'CreateRating')
createRating(data: any) { return this.orderService.createRating(data); }

@GrpcMethod('OrderService', 'GetRatingsByRestaurant')
getRatingsByRestaurant(data: { restaurantId: number }) {
  return this.orderService.getRatingsByRestaurant(data.restaurantId);
}

@GrpcMethod('OrderService', 'GetRatingByOrder')
getRatingByOrder(data: { orderId: number }) {
  return this.orderService.getRatingByOrder(data.orderId);
}
}
