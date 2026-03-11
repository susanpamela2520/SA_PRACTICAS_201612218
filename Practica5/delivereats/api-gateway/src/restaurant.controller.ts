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
  createRestaurant(data: any): any; // CRUD para restaurantes
  getRestaurants(data: any): any;
  getRestaurant(data: any): any;
  updateRestaurant(data: any): any;
  deleteRestaurant(data: any): any;
  createMenuItem(data: any): any;   // CRUD para el menú
  getMenu(data: any): any;
  updateMenuItem(data: any): any; 
  deleteMenuItem(data: any): any; 
  getIncomingOrders(data: any): any; //ordenes entrantes
  acceptOrder(data: any): any;   //aceptar orden
  rejectOrder(data: any): any;   //rechazar orden 
  getFilteredRestaurants(data: any): any; //listado con filtros y busqueda
}

@Controller('restaurants')
export class RestaurantController implements OnModuleInit {
  private restaurantService: RestaurantServiceClient;

  constructor(@Inject('RESTAURANT_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.restaurantService = this.client.getService<RestaurantServiceClient>('RestaurantService');
  }

  // listado de restaurantes y detalles de un restaurante  

  @Get()
  async getAll() {
    return this.restaurantService.getRestaurants({});
  }

  //va primero el filter para que no se confunda con el id
  @Get('filter')
  async getFiltered(
    @Query('category') category?: string,
    @Query('sortBy') sortBy?: string,
    @Query('onlyWithPromotion') onlyWithPromotion?: string,
    @Query('search') search?: string,
  ) {
    return lastValueFrom(
      this.restaurantService.getFilteredRestaurants({
        category: category || '',
        sortBy: sortBy || '',
        onlyWithPromotion: onlyWithPromotion === 'true',
        search: search || '',
      }),
    );
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
      throw new HttpException(e.message || 'Error al obtener órdenes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

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

 
  // CRUD para los restaurantes (SOLO ADMIN)
  

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


  // CRUD para el menu en los  (roles de Restaurante/Vendedor)
 

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

 
  // ÓRDENES (RabbitMQ flow) (dispara flujo de eventos)
  // cuando un restaurante acepta y rechaza la orden por endpoints
  @Post('orders/:orderId/accept')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async acceptOrder(@Param('orderId') orderId: string) {
    try {
      return await lastValueFrom(
        this.restaurantService.acceptOrder({ orderId: Number(orderId) }),
      );
    } catch (e) {
      throw new HttpException(e.message || 'Error al aceptar orden', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('orders/:orderId/reject')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Restaurante', 'Vendedor')
  async rejectOrder(@Param('orderId') orderId: string, @Body() body: { reason: string }) {
    try {
      return await lastValueFrom(
        this.restaurantService.rejectOrder({ orderId: Number(orderId), reason: body.reason }),
      );
    } catch (e) {
      throw new HttpException(e.message || 'Error al rechazar orden', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}