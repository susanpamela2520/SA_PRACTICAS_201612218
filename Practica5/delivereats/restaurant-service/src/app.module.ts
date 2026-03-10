import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

import { Restaurant } from './entities/restaurant.entity';
import { MenuItem } from './entities/menu-item.entity';
import { RestaurantOrder } from './entities/restaurant-order.entity';

import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { OrderEventsConsumer } from './order-events.consumer';

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
        entities: [Restaurant, MenuItem, RestaurantOrder],  // aqui se agrega RestaurantOrder para que se cree la tabla en la base de datos
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    // Registrar las 3 entidades para que se coloque la data
    TypeOrmModule.forFeature([Restaurant, MenuItem, RestaurantOrder]),  // ← Agregar RestaurantOrder

    // RabbitMQ, consumen los eventos
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          {
            name: 'delivereats_exchange',
            type: 'direct',
          },
        ],
        uri: config.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672'),
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService, OrderEventsConsumer],
})
export class AppModule {}