
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FxController } from './fx.controller';
import { FxService } from './fx.service';
import { CacheService } from '../cache/cache.service';

@Module({
  imports: [
    HttpModule, // Para llamar a la API externa de tasas
  ],
  controllers: [FxController],
  providers: [FxService, CacheService],
})
export class FxModule {}
