// restaurant-service/src/app.module.ts — REEMPLAZAR
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { Restaurant } from './restaurant/entities/restaurant.entity';
import { MenuItem } from './restaurant/entities/menu-item.entity';
import { RestaurantOrder } from './restaurant/entities/restaurant-order.entity';

import { RestaurantController } from './restaurant/restaurant.controller';
import { RestaurantService } from './restaurant/restaurant.service';
import { OrderEventsConsumer } from './order-event.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST_REST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME_REST'),
        entities: [Restaurant, MenuItem, RestaurantOrder],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    // Una sola instancia de RabbitMQ — global para toda la app
    TypeOrmModule.forFeature([Restaurant, MenuItem, RestaurantOrder]),

    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        exchanges: [{ name: 'delivereats_exchange', type: 'direct' }],
        uri: config.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
  ],
  // Todo en un solo módulo: controller, service y consumer juntos
  controllers: [RestaurantController],
  providers: [RestaurantService, OrderEventsConsumer],
})
export class AppModule {}