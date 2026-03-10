// order-service/src/order/order.module.ts — REEMPLAZAR
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderEventsConsumer } from './order-events.consumer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),

    // Necesario para que AmqpConnection 
    // esté disponible en OrderService
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
  controllers: [OrderController],
  providers: [OrderService, OrderEventsConsumer],
})
export class OrderModule {}