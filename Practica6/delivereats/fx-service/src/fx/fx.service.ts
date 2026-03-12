
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CacheService } from '../cache/cache.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly BASE_URL = 'https://open.er-api.com/v6/latest';

  constructor(
    private readonly http: HttpService,
    private readonly cache: CacheService,
  ) {}

  async getExchangeRate(data: any) {
    // gRPC convierte from_currency → fromCurrency (camelCase)
    const from = (data.fromCurrency || data.from_currency || 'GTQ').toUpperCase();
    const to   = (data.toCurrency   || data.to_currency   || 'USD').toUpperCase();

    this.logger.log(`Getting rate ${from} → ${to}`);

    // 1. Cache normal
    const cached = await this.cache.getRate(from, to);
    if (cached) {
      return { from_currency: from, to_currency: to, rate: cached, source: 'cache' };
    }

    // 2. API externa
    try {
      const url = `${this.BASE_URL}/${from}`;
      const response = await firstValueFrom(
        this.http.get<any>(url, { timeout: 5000 } as any)
      );
      const rate = response.data?.rates?.[to];
      if (!rate) throw new Error(`Rate ${to} not found`);

      await this.cache.setRate(from, to, rate, Date.now());
      this.logger.log(`API rate ${from}→${to} = ${rate}`);
      return { from_currency: from, to_currency: to, rate, source: 'api' };

    } catch (err) {
      this.logger.warn(`API failed, trying fallback: ${err.message}`);

      // 3. Fallback Redis
      const fallback = await this.cache.getFallbackRate(from, to);
      if (fallback) {
        return { from_currency: from, to_currency: to, rate: fallback, source: 'fallback' };
      }

      // 4. Fallback hardcoded
      if (from === 'GTQ' && to === 'USD') {
        return { from_currency: from, to_currency: to, rate: 0.13, source: 'hardcoded' };
      }

      throw new Error(`No rate available for ${from}→${to}`);
    }
  }

  async getMultipleRates(data: any) {
    const base    = (data.baseCurrency || data.base_currency || 'GTQ').toUpperCase();
    const targets = data.targetCurrencies || data.target_currencies || ['USD'];

    const rates: Record<string, number> = {};
    for (const target of targets) {
      try {
        const result = await this.getExchangeRate({ fromCurrency: base, toCurrency: target });
        rates[target] = result.rate;
      } catch {
        rates[target] = 0;
      }
    }
    return { base_currency: base, rates };
  }
}