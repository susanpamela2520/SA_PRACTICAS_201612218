import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { RestaurantController } from './restaurant.controller';
import { OrderController } from './order.controller';
import { join } from 'path';
import { existsSync } from 'fs';

const protoPathRoot = existsSync(join(process.cwd(), 'dist/proto'))
  ? join(process.cwd(), 'dist/proto')
  : join(process.cwd(), 'src/proto');

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(protoPathRoot, 'auth.proto'),
          url: 'auth-service:50051',
        },
      },
      {
        name: 'RESTAURANT_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'restaurant',
          protoPath: join(protoPathRoot, 'restaurant.proto'),
          url: 'restaurant-service:50052',
        },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'order',
          protoPath: join(protoPathRoot, 'order.proto'),
          url: 'order-service:50053',
        },
      },
    ]),
  ],
  controllers: [AppController, RestaurantController, OrderController],
  providers: [],
})
export class AppModule {}
