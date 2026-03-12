
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
        package: 'fx',
        protoPath: join(__dirname, 'proto/fx_service.proto'),
        url: '0.0.0.0:50055',
      },
    },
  );
  await app.listen();
  console.log('FX-Service running on port 50055');
}
bootstrap();
