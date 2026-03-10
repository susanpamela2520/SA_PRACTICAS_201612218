import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Inject,
  OnModuleInit,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { lastValueFrom } from 'rxjs';

interface RestaurantServiceClient {
  // Restaurantes
  createRestaurant(data: any): any;
  getRestaurants(data: any): any;
  getRestaurant(data: any): any;
  updateRestaurant(data: any): any;
  deleteRestaurant(data: any): any;
  // Menú
  createMenuItem(data: any): any;
  getMenu(data: any): any;
  updateMenuItem(data: any): any;
  deleteMenuItem(data: any): any;
  // ── NUEVO: Gestión de órdenes entrantes ──
  getIncomingOrders(data: any): any;
  acceptOrder(data: any): any;
  rejectOrder(data: any): any;
}

@Controller('restaurants')
export class RestaurantController implements OnModuleInit {
  private restaurantService: RestaurantServiceClient;

  constructor(@Inject('RESTAURANT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.restaurantService =
      this.client.getService<RestaurantServiceClient>('RestaurantService');
  }

  // ══════════════════════════════════════════════════════════
  //  READ - PÚBLICOS (sin auth)
  // ══════════════════════════════════════════════════════════

  @Get()
  async getAll() {
    return this.restaurantService.getRestaurants({});
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    try {
      return await lastValueFrom(
        this.restaurantService.getRestaurant({ id: Number(id) }),
      );
    } catch (e) {
      throw new HttpException('Restaurante no encontrado', HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id/menu')
  async getMenu(@Param('id') id: string) {
    return this.restaurantService.getMenu({ restaurantId: Number(id) });
  }

  // ══════════════════════════════════════════════════════════
  //  CRUD RESTAURANTES (solo Administrador)
  // ══════════════════════════════════════════════════════════

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Administrador')
  async createRestaurant(@Body() body: any) {
    return this.restaurantService.createRestaurant(body);
  }

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

  // ══════════════════════════════════════════════════════════
  //  CRUD MENÚ (Restaurante / Vendedor)
  // ══════════════════════════════════════════════════════════

  @Post(':id/menu')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async createDish(@Param('id') id: string, @Body() body: any) {
    return this.restaurantService.createMenuItem({
      ...body,
      restaurantId: Number(id),
    });
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

  // ══════════════════════════════════════════════════════════
  //  GESTIÓN DE ÓRDENES ENTRANTES — NUEVO
  // ══════════════════════════════════════════════════════════

  /**
   * GET /restaurants/:restaurantId/orders
   * El restaurante ve su bandeja de órdenes pendientes/procesadas.
   */
  @Get(':restaurantId/orders')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor', 'Administrador')
  async getIncomingOrders(@Param('restaurantId') restaurantId: string) {
    return this.restaurantService.getIncomingOrders({
      restaurantId: Number(restaurantId),
    });
  }

  /**
   * POST /restaurants/orders/:orderId/accept
   * Body: { restaurantId: number }
   * El restaurante acepta la orden → publica order.accepted a RabbitMQ.
   */
  @Post('orders/:orderId/accept')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async acceptOrder(
    @Param('orderId') orderId: string,
    @Body() body: { restaurantId: number },
  ) {
    try {
      return await lastValueFrom(
        this.restaurantService.acceptOrder({
          orderId: Number(orderId),
          restaurantId: body.restaurantId,
        }),
      );
    } catch (e) {
      throw new HttpException(
        e.message || 'Error al aceptar la orden',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * POST /restaurants/orders/:orderId/reject
   * Body: { restaurantId: number, reason?: string }
   * El restaurante rechaza la orden → publica order.rejected a RabbitMQ.
   */
  @Post('orders/:orderId/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async rejectOrder(
    @Param('orderId') orderId: string,
    @Body() body: { restaurantId: number; reason?: string },
  ) {
    try {
      return await lastValueFrom(
        this.restaurantService.rejectOrder({
          orderId: Number(orderId),
          restaurantId: body.restaurantId,
          reason: body.reason || 'Rechazado por el restaurante',
        }),
      );
    } catch (e) {
      throw new HttpException(
        e.message || 'Error al rechazar la orden',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}