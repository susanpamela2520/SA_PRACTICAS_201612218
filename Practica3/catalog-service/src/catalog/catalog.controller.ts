import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CatalogService } from './catalog.service';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @GrpcMethod('CatalogService', 'ValidateProducts')
  async validateProducts(data: any) {
    console.log('🔍 Validación solicitada:', {
      restaurantId: data.restaurant_id,
      productCount: data.products?.length,
    });

    try {
      const result = await this.catalogService.validateProducts(
        data.restaurant_id,
        data.products,
      );

      console.log('✅ Resultado validación:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en validación:', error);
      return {
        valid: false,
        message: 'Error en validación',
        errors: [error.message],
      };
    }
  }
}