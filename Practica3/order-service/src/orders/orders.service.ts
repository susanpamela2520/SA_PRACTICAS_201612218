import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { CatalogGrpcClient } from './catalog.grpc.client';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private catalogClient: CatalogGrpcClient,
  ) {}

  async createOrder(dto: any) {
    console.log('📦 Iniciando creación de orden:', {
      restaurantId: dto.restaurantId,
      userId: dto.userId,
      productCount: dto.productos?.length,
    });

    // 🔍 VALIDACIÓN GRPC - Antes de persistir
    try {
      const validation = await this.catalogClient.validateProducts(
        dto.restaurantId,
        dto.productos,
      );

      console.log('🎯 Resultado validación:', validation);

      if (!validation.valid) {
        console.log('❌ ORDEN RECHAZADA - Validación fallida:', validation.errors);
        throw new HttpException(
          {
            ok: false,
            message: 'Orden rechazada',
            errors: validation.errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log('✅ Validación exitosa, procediendo a crear orden...');
    } catch (error) {
      console.error('❌ Error al validar productos:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          ok: false,
          message: 'Error al validar productos',
          errors: [error.message],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // ✅ Validación exitosa - Crear orden
    const total = dto.productos.reduce(
      (sum: number, p: any) => sum + p.expected_price * p.quantity,
      0,
    );

    const order = this.orderRepo.create({
      restaurantId: dto.restaurantId,
      userId: dto.userId,
      productos: dto.productos,
      total,
      estado: 'CONFIRMADA',
    });

    const saved = await this.orderRepo.save(order);

    console.log('✅ ORDEN CREADA EXITOSAMENTE:', {
      orderId: saved.id,
      total: saved.total,
      estado: saved.estado,
    });

    return {
      ok: true,
      message: 'Orden creada exitosamente',
      order: saved,
    };
  }

  async getOrders() {
    return await this.orderRepo.find({
      order: { createdAt: 'DESC' },
    });
  }
}