// fx-service/src/cache/cache.service.ts
// ============================================================
// Maneja Redis:
// - set_rate(): guarda tasa normal (TTL: 6 min) y fallback (24h)
// - get_rate(): lee tasa del cache normal
// - get_fallback_rate(): lee tasa del fallback cuando la API falla
// ============================================================
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;

  // TTLs en segundos
  private readonly CACHE_TTL = 360;        // 6 minutos — tasa fresca
  private readonly FALLBACK_TTL = 86400;   // 24 horas — fallback de emergencia

  constructor(private config: ConfigService) {}

  onModuleInit() {
    try {
      this.redis = new Redis({
        host: this.config.get('REDIS_HOST', 'redis'),
        port: this.config.get<number>('REDIS_PORT', 6379),
        password: this.config.get('REDIS_PASSWORD', ''),
        lazyConnect: true,
      });

      this.redis.on('connect', () =>
        this.logger.log('Conectado a Redis'),
      );
      this.redis.on('error', (err) =>
        this.logger.error(`Error Redis: ${err.message}`),
      );
    } catch (e) {
      this.logger.error('No se pudo inicializar Redis');
    }
  }

  // Llave del cache normal
  private key(from: string, to: string) {
    return `fx:${from}:${to}`;
  }

  // Llave del fallback (persiste más tiempo)
  private fallbackKey(from: string, to: string) {
    return `fx:${from}:${to}:fallback`;
  }

  // Guardar tasa en cache normal y fallback simultáneamente
  async setRate(from: string, to: string, rate: number, timestamp: number): Promise<void> {
    if (!this.redis) return;
    try {
      const data = JSON.stringify({ from_currency: from, to_currency: to, rate, timestamp });
      // Cache normal: expira en 6 min
      await this.redis.setex(this.key(from, to), this.CACHE_TTL, data);
      // Fallback: expira en 24h (siempre se actualiza junto con el normal)
      await this.redis.setex(this.fallbackKey(from, to), this.FALLBACK_TTL, data);
      this.logger.log(`Cache guardado: ${from}→${to} = ${rate}`);
    } catch (e) {
      this.logger.error(`Error guardando en cache: ${e.message}`);
    }
  }

  // Leer tasa del cache normal
  async getRate(from: string, to: string): Promise<any | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(this.key(from, to));
      if (data) {
        this.logger.log(`Cache HIT: ${from}→${to}`);
        return { ...JSON.parse(data), from_cache: true, is_fallback: false };
      }
      this.logger.log(`Cache MISS: ${from}→${to}`);
      return null;
    } catch (e) {
      return null;
    }
  }

  // Leer tasa del fallback (cuando la API externa falla)
  async getFallbackRate(from: string, to: string): Promise<any | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(this.fallbackKey(from, to));
      if (data) {
        this.logger.warn(`FALLBACK usado: ${from}→${to}`);
        return { ...JSON.parse(data), from_cache: true, is_fallback: true };
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
