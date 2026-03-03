
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
  // Este servicio NO expone un puerto HTTP ni gRPC.
  // Solo se conecta a RabbitMQ para consumir mensajes.
  const app = await NestFactory.create(AppModule);

  await app.init();
  console.log('Notification-Service iniciado y escuchando cola RabbitMQ...');
}

bootstrap();
