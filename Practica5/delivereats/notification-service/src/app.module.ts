
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { NotificationConsumer } from './notification.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          {
            name: 'delivereats_exchange',
            type: 'direct',
          },
        ],
        uri: config.get<string>(
          'RABBITMQ_URL',
          'amqp://guest:guest@localhost:5672',
        ),
        connectionInitOptions: { wait: false },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [NotificationConsumer],
})
export class AppModule {}