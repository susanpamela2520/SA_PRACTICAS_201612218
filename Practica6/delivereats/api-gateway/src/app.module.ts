// api-gateway/src/app.module.ts — REEMPLAZAR COMPLETO
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { RestaurantController } from './restaurant.controller';
import { OrderController } from './order.controller';
import { PaymentController } from './payment.controller';   // NUEVO
import { FxController } from './fx.controller';             // NUEVO
import { AdminController } from './admin.controller';       // NUEVO
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
      // NUEVO: Payment Service
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'payment',
          protoPath: join(protoPathRoot, 'payment_service.proto'),
          url: 'payment-service:50056',
        },
      },
      // NUEVO: FX Service
      {
        name: 'FX_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'fx',
          protoPath: join(protoPathRoot, 'fx_service.proto'),
          url: 'fx-service:50055',
        },
      },
    ]),
  ],
  controllers: [
    AppController,
    RestaurantController,
    OrderController,
    PaymentController,  // NUEVO
    FxController,       // NUEVO
    AdminController,    // NUEVO
  ],
  providers: [],
})
export class AppModule {}
