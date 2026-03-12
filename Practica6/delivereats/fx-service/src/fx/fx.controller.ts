
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { FxService } from './fx.service';

@Controller()
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @GrpcMethod('FXService', 'GetExchangeRate')
  getExchangeRate(data: any) {
    return this.fxService.getExchangeRate(data);
  }

  @GrpcMethod('FXService', 'GetMultipleRates')
  getMultipleRates(data: any) {
    return this.fxService.getMultipleRates(data);
  }
}