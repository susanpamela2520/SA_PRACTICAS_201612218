import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderEventsConsumer } from './order-events.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  controllers: [OrderController],
  providers: [OrderService, OrderEventsConsumer],
})
export class OrderModule {}