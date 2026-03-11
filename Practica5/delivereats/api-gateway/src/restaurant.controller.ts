// api-gateway/src/restaurant.controller.ts — REEMPLAZAR (versión final completa)
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Inject, OnModuleInit,
  UseGuards, HttpException, HttpStatus, Query,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { lastValueFrom } from 'rxjs';

interface RestaurantServiceClient {
  createRestaurant(data: any): any;
  getRestaurants(data: any): any;
  getRestaurant(data: any): any;
  updateRestaurant(data: any): any;
  deleteRestaurant(data: any): any;
  createMenuItem(data: any): any;
  getMenu(data: any): any;
  updateMenuItem(data: any): any;
  deleteMenuItem(data: any): any;
  getIncomingOrders(data: any): any;
  acceptOrder(data: any): any;
  rejectOrder(data: any): any;
  getFilteredRestaurants(data: any): any;
  createPromotion(data: any): any;
  getPromotionsByRestaurant(data: any): any;
  getActivePromotions(data: any): any;
  deletePromotion(data: any): any;
  createCoupon(data: any): any;
  getCouponsByRestaurant(data: any): any;
  getPendingCoupons(data: any): any;
  approveCoupon(data: any): any;
  rejectCoupon(data: any): any;
  validateCoupon(data: any): any;
}

@Controller('restaurants')
export class RestaurantController implements OnModuleInit {
  private restaurantService: RestaurantServiceClient;

  constructor(@Inject('RESTAURANT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.restaurantService = this.client.getService<RestaurantServiceClient>('RestaurantService');
  }

  // Restaurantes disponibles para orden

  @Get()
  async getAll() { return this.restaurantService.getRestaurants({}); }

  @Get('filter')
  async getFiltered(
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: string,
    @Query('onlyWithPromotion') onlyWithPromotion?: string,
    @Query('search') search?: string,
  ) {
    return lastValueFrom(this.restaurantService.getFilteredRestaurants({
      category: category || '',
      sortBy: sortBy || '',
      onlyWithPromotion: onlyWithPromotion === 'true',
      search: search || '',
    }));
  }

  @Get(':restaurantId/orders')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async getIncomingOrders(@Param('restaurantId') restaurantId: string) {
    try {
      return await lastValueFrom(
        this.restaurantService.getIncomingOrders({ restaurantId: Number(restaurantId) }),
      );
    } catch (e) {
      throw new HttpException(e.message || 'Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Promociones

  // Activas (cliente lo mira antes de ordenar)
  @Get(':restaurantId/promotions/active')
  async getActivePromotions(@Param('restaurantId') restaurantId: string) {
    return lastValueFrom(
      this.restaurantService.getActivePromotions({ restaurantId: Number(restaurantId) }),
    );
  }

  // Todas las del restaurante (para el vendedor gestionarlas)
  @Get(':restaurantId/promotions')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async getPromotionsByRestaurant(@Param('restaurantId') restaurantId: string) {
    return lastValueFrom(
      this.restaurantService.getPromotionsByRestaurant({ restaurantId: Number(restaurantId) }),
    );
  }

  @Post(':restaurantId/promotions')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async createPromotion(@Param('restaurantId') restaurantId: string, @Body() body: any) {
    return lastValueFrom(
      this.restaurantService.createPromotion({ ...body, restaurantId: Number(restaurantId) }),
    );
  }

  @Delete('promotions/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async deletePromotion(@Param('id') id: string) {
    return lastValueFrom(this.restaurantService.deletePromotion({ id: Number(id) }));
  }

  // cupones 

  // Pendientes de aprobación (solo Admin)
  @Get('coupons/pending')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async getPendingCoupons() {
    return lastValueFrom(this.restaurantService.getPendingCoupons({}));
  }

  @Get(':restaurantId/coupons')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async getCouponsByRestaurant(@Param('restaurantId') restaurantId: string) {
    return lastValueFrom(
      this.restaurantService.getCouponsByRestaurant({ restaurantId: Number(restaurantId) }),
    );
  }

  @Post(':restaurantId/coupons')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async createCoupon(@Param('restaurantId') restaurantId: string, @Body() body: any) {
    return lastValueFrom(
      this.restaurantService.createCoupon({ ...body, restaurantId: Number(restaurantId) }),
    );
  }

  @Post('coupons/:couponId/approve')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async approveCoupon(@Param('couponId') couponId: string) {
    return lastValueFrom(this.restaurantService.approveCoupon({ couponId: Number(couponId) }));
  }

  @Post('coupons/:couponId/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async rejectCoupon(@Param('couponId') couponId: string, @Body() body: { reason: string }) {
    return lastValueFrom(
      this.restaurantService.rejectCoupon({ couponId: Number(couponId), reason: body.reason }),
    );
  }

  // Validar cupón antes de que se cree la orden 
  @Post('coupons/validate')
  @UseGuards(AuthGuard)
  async validateCoupon(@Body() body: { code: string; restaurantId: number; orderTotal: number }) {
    return lastValueFrom(this.restaurantService.validateCoupon(body));
  }

  // CRUD para el restaurante para el administrador

  @Get(':id')
  async getOne(@Param('id') id: string) {
    try {
      return await lastValueFrom(this.restaurantService.getRestaurant({ id: Number(id) }));
    } catch (e) {
      throw new HttpException('Restaurante no encontrado', HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/menu')
  async getMenu(@Param('id') id: string) {
    return this.restaurantService.getMenu({ restaurantId: Number(id) });
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async createRestaurant(@Body() body: any) { return this.restaurantService.createRestaurant(body); }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async updateRestaurant(@Param('id') id: string, @Body() body: any) {
    return this.restaurantService.updateRestaurant({ ...body, id: Number(id) });
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async deleteRestaurant(@Param('id') id: string) {
    return this.restaurantService.deleteRestaurant({ id: Number(id) });
  }

  // CRUD para el menu de restaurente y vendedor 

  @Post(':id/menu')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async createDish(@Param('id') id: string, @Body() body: any) {
    return this.restaurantService.createMenuItem({ ...body, restaurantId: Number(id) });
  }

  @Put('menu/:itemId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async updateDish(@Param('itemId') itemId: string, @Body() body: any) {
    return this.restaurantService.updateMenuItem({ ...body, id: Number(itemId) });
  }

  @Delete('menu/:itemId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async deleteDish(@Param('itemId') itemId: string) {
    return this.restaurantService.deleteMenuItem({ id: Number(itemId) });
  }

  // ordenes 

  @Post('orders/:orderId/accept')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async acceptOrder(@Param('orderId') orderId: string) {
    return lastValueFrom(this.restaurantService.acceptOrder({ orderId: Number(orderId) }));
  }

  @Post('orders/:orderId/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async rejectOrder(@Param('orderId') orderId: string, @Body() body: { reason: string }) {
    return lastValueFrom(
      this.restaurantService.rejectOrder({ orderId: Number(orderId), reason: body.reason }),
    );
  }
}