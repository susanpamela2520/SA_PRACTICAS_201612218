import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Payment } from './payment/entities/payment.entity';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST_PAYMENT || 'postgres-payment',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'Hola.123#',
      database: process.env.DB_NAME_PAYMENT || 'payment-db',
      entities: [Payment],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Payment]),
    ClientsModule.register([
      {
        name: 'ORDER_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'order',
          protoPath: join(__dirname, 'proto/order.proto'),
          url: process.env.ORDER_SERVICE_URL || 'order-service:50053',
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class AppModule {}