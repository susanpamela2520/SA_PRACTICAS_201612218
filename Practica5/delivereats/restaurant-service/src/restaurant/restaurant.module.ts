import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { RestaurantOrder } from './entities/restaurant-order.entity';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, MenuItem, RestaurantOrder])],
  controllers: [RestaurantController],
  providers: [RestaurantService],
})
export class RestaurantModule {}