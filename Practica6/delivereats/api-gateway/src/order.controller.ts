// api-gateway/src/order.controller.ts
import {
  Controller, Get, Post, Patch, Body,
  Param, Inject, OnModuleInit, UseGuards, Req,
} from "@nestjs/common";
import type { ClientGrpc } from "@nestjs/microservices";
import { AuthGuard } from "./auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";

interface OrderServiceClient {
  createOrder(data: any): any;
  getOrder(data: any): any;
  getOrdersByUser(data: any): any;
  updateOrderStatus(data: any): any;
  uploadDeliveryPhoto(data: any): any;
  updatePaymentStatus(data: any): any;
  getOrdersByRestaurant(data: any): any;
  getFinishedOrders(data: any): any;
  getOrdersByStatus(data: any): any;
  createRating(data: any): any;
getRatingsByRestaurant(data: any): any;
getRatingByOrder(data: any): any;
}

@Controller("orders")
@UseGuards(AuthGuard, RolesGuard)
export class OrderController implements OnModuleInit {
  private orderService: OrderServiceClient;

  constructor(@Inject("ORDER_SERVICE") private client: ClientGrpc) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderServiceClient>("OrderService");
  }

  @Post()
  @Roles("Cliente")
  async createOrder(@Req() req: any, @Body() body: any) {
    return this.orderService.createOrder({ ...body, userId: req.user.userId });
  }

  @Get()
  @Roles("Cliente")
  async getMyOrders(@Req() req: any) {
    return this.orderService.getOrdersByUser({ userId: req.user.userId });
  }

@Get("by-status/:status")
  @Roles("Repartidor", "Administrador")
  async getByStatus(@Param("status") status: string) {
    return this.orderService.getOrdersByStatus({ status });
  }

   @Get("restaurant/:restaurantId")
  @Roles("Restaurante", "Vendedor", "Administrador")
  async getByRestaurant(@Param("restaurantId") restaurantId: string) {
    return this.orderService.getOrdersByRestaurant({ restaurantId: Number(restaurantId) });
  }
  
  @Get(":id")
  async getOne(@Param("id") id: string) {
    return this.orderService.getOrder({ id: Number(id) });
  }

  @Patch(":id/status")
  @Roles("Restaurante", "Vendedor", "Repartidor", "Administrador")
  async updateStatus(@Param("id") id: string, @Body() body: any) {
    return this.orderService.updateOrderStatus({
      id: Number(id),
      status: body.status,
      deliveryFailedReason: body.deliveryFailedReason || "",
    });
  }

  @Post(":orderId/delivery-photo")
  @Roles("Repartidor", "Vendedor", "Restaurante")
  async uploadDeliveryPhoto(@Param("orderId") orderId: string, @Body() body: any) {
    return this.orderService.uploadDeliveryPhoto({
      orderId: Number(orderId),
      photoBase64: body.photoBase64,
    });
  }

  //Rating 
  @Post('rate')
@Roles('Cliente')
async rateOrder(@Body() body: any, @Req() req: any) {
  return this.orderService.createRating({ ...body, userId: req.user.userId });
}

@Get('ratings/restaurant/:restaurantId')
@Roles('Restaurante', 'Vendedor', 'Administrador', 'Cliente')
async getRestaurantRatings(@Param('restaurantId') restaurantId: string) {
  return this.orderService.getRatingsByRestaurant({ restaurantId: Number(restaurantId) });
}

@Get(':orderId/rating')
@Roles('Cliente', 'Administrador', 'Repartidor')
async getOrderRating(@Param('orderId') orderId: string) {
  return this.orderService.getRatingByOrder({ orderId: Number(orderId) });
}
}
