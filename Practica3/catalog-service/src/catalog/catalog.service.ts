import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async validateProducts(restaurantId: number, products: any[]) {
    const errors: string[] = [];

    console.log(`🔎 Validando ${products.length} productos para restaurante ${restaurantId}`);

    for (const item of products) {
      const product = await this.productRepo.findOne({
        where: { id: item.product_id },
      });

      // ❌ Producto no existe
      if (!product) {
        errors.push(`Producto ${item.product_id} no existe`);
        console.log(`❌ Producto ${item.product_id} NO encontrado`);
        continue;
      }

      // ❌ Producto no pertenece al restaurante
      if (product.restaurantId !== restaurantId) {
        errors.push(
          `Producto ${item.product_id} no pertenece al restaurante ${restaurantId}`,
        );
        console.log(
          `❌ Producto ${item.product_id} pertenece a restaurante ${product.restaurantId}, no a ${restaurantId}`,
        );
        continue;
      }

      // ❌ Producto no disponible
      if (!product.disponible) {
        errors.push(`Producto ${item.product_id} (${product.nombre}) no está disponible`);
        console.log(`❌ Producto ${item.product_id} NO disponible`);
        continue;
      }

      // ❌ Precio no coincide
      if (parseFloat(item.expected_price) !== parseFloat(product.precio.toString())) {
        errors.push(
          `Precio incorrecto para ${product.nombre}. Esperado: ${item.expected_price}, Actual: ${product.precio}`,
        );
        console.log(
          `❌ Precio incorrecto: esperado ${item.expected_price}, actual ${product.precio}`,
        );
        continue;
      }

      console.log(`✅ Producto ${item.product_id} validado correctamente`);
    }

    if (errors.length > 0) {
      return {
        valid: false,
        message: 'Validación fallida',
        errors,
      };
    }

    return {
      valid: true,
      message: 'Todos los productos son válidos',
      errors: [],
    };
  }
}