// api-gateway/src/order.controller.ts — REEMPLAZAR COMPLETO
import {
  Controller, Get, Post, Patch, Body,
  Param, Inject, OnModuleInit, UseGuards, Req,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

interface OrderServiceClient {
  createOrder(data: any): any;
  getOrder(data: any): any;
  getOrdersByUser(data: any): any;
  updateOrderStatus(data: any): any;
  uploadDeliveryPhoto(data: any): any;         // NUEVO
  updatePaymentStatus(data: any): any;         // NUEVO
  getOrdersByRestaurant(data: any): any;       // NUEVO
  getFinishedOrders(data: any): any;           // NUEVO
}

@Controller('orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrderController implements OnModuleInit {
  private orderService: OrderServiceClient;

  constructor(@Inject('ORDER_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderServiceClient>('OrderService');
  }

  // 1. Crear orden (Cliente)
  @Post()
  @Roles('Cliente')
  async createOrder(@Req() req: any, @Body() body: any) {
    return this.orderService.createOrder({ ...body, userId: req.user.userId });
  }

  // 2. Mis órdenes (Cliente)
  @Get()
  @Roles('Cliente')
  async getMyOrders(@Req() req: any) {
    return this.orderService.getOrdersByUser({ userId: req.user.userId });
  }

  // 3. Ver una orden
  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.orderService.getOrder({ id: Number(id) });
  }

  // 4. Actualizar estado (Restaurante/Vendedor)
  @Patch(':id/status')
  @Roles('Restaurante', 'Vendedor')
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.orderService.updateOrderStatus({
      id: Number(id),
      status: body.status,
      deliveryFailedReason: body.deliveryFailedReason || '',
    });
  }

  // 5. NUEVO: Repartidor sube foto de entrega
  @Post(':orderId/delivery-photo')
  @Roles('Repartidor', 'Vendedor', 'Restaurante')
  async uploadDeliveryPhoto(@Param('orderId') orderId: string, @Body() body: any) {
    return this.orderService.uploadDeliveryPhoto({
      orderId: Number(orderId),
      photoBase64: body.photoBase64,
    });
  }

  // 6. NUEVO: Órdenes del restaurante
  @Get('restaurant/:restaurantId')
  @Roles('Restaurante', 'Vendedor', 'Administrador')
  async getByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.orderService.getOrdersByRestaurant({ restaurantId: Number(restaurantId) });
  }
}
