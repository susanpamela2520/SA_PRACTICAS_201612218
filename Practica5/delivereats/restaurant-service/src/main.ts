import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Se crear la app como HTTP app y permite que se
  // cumplea el lifecycle de NestJS.
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

  // Aqui se inicia el microservicio gRPC
  await app.init();
  await app.startAllMicroservices();

  // NO llamamos app.listen() → no expone puerto HTTP, solo gRPC + RabbitMQ
  console.log('Restaurant Microservice escuchando en puerto 50052 (gRPC) + RabbitMQ');
}

bootstrap();