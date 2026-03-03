// api-gateway/src/fx.controller.ts
import { Controller, Get, Query, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';

interface FxServiceClient {
  getExchangeRate(data: any): any;
  getMultipleRates(data: any): any;
}

@Controller('fx')
export class FxController implements OnModuleInit {
  private fxService: FxServiceClient;

  constructor(@Inject('FX_SERVICE') private client: ClientGrpc) {}

  onModuleInit() {
    this.fxService = this.client.getService<FxServiceClient>('FXService');
  }

  @Get('rate')
  async getRate(
    @Query('from') from: string = 'GTQ',
    @Query('to') to: string = 'USD',
  ) {
    return this.fxService.getExchangeRate({
      from_currency: from,
      to_currency: to,
    });
  }

  @Get('rates')
  async getRates(
    @Query('base') base: string = 'GTQ',
    @Query('targets') targets: string = 'USD',
  ) {
    return this.fxService.getMultipleRates({
      base_currency: base,
      target_currencies: targets.split(','),
    });
  }
}