// payment-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'payment',
        protoPath: join(__dirname, 'proto/payment_service.proto'),
        url: '0.0.0.0:50056',
      },
    },
  );
  await app.listen();
  console.log('Payment-Service running on port 50056');
}
bootstrap();
