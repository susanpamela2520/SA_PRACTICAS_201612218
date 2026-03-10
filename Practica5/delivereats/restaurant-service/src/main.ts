// restaurant-service/src/main.ts
//
// IMPORTANTE: Usamos NestFactory.create() (app híbrida) en vez de createMicroservice()
// para que @golevelup/nestjs-rabbitmq inicialice correctamente sus listeners.
// El servidor gRPC se conecta via connectMicroservice().

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Crear la app como HTTP app (permite lifecycle hooks de RabbitMQ)
  const app = await NestFactory.create(AppModule);

  // Conectar el transporte gRPC como microservicio adicional
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'restaurant',
      protoPath: join(__dirname, 'proto/restaurant.proto'),
      url: '0.0.0.0:50052',
    },
  });

  // Iniciar el microservicio gRPC
  await app.startAllMicroservices();

  // NO llamamos app.listen() → no expone puerto HTTP, solo gRPC + RabbitMQ
  console.log('Restaurant Microservice escuchando en puerto 50052 (gRPC) + RabbitMQ');
}

bootstrap();