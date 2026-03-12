import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { Coupon } from './entities/coupon.entity';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class PromotionCouponService {
  constructor(
    @InjectRepository(Promotion)
    private promotionRepo: Repository<Promotion>,
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
  ) {}

  // PROMOCIONES

  async createPromotion(data: {
    restaurantId: number;
    title: string;
    description?: string;
    type: string;
    discountPercent?: number;
    comboDescription?: string;
    comboPrice?: number;
    startDate: string;
    endDate: string;
  }): Promise<Promotion> {
    // Validaciones
    if (data.type === 'percentage') {
      if (!data.discountPercent || data.discountPercent <= 0 || data.discountPercent > 100) {
        throw new BadRequestException('El porcentaje debe estar entre 1 y 100');
      }
    }
    if (data.type === 'combo' && !data.comboDescription) {
      throw new BadRequestException('El combo debe tener una descripción');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end <= start) throw new BadRequestException('La fecha de fin debe ser posterior al inicio');

    const promo = this.promotionRepo.create({
      ...data,
      type: data.type as any,
      startDate: start,
      endDate: end,
      isActive: true,
    });
    const saved = await this.promotionRepo.save(promo);

    // Marcar restaurante con promoción activa
    await this.restaurantRepo.update(data.restaurantId, { hasActivePromotion: true });

    return saved as unknown as Promotion;
  }

  async getPromotionsByRestaurant(restaurantId: number): Promise<{ promotions: Promotion[] }> {
    const promotions = await this.promotionRepo.find({
      where: { restaurantId },
      order: { createdAt: 'DESC' },
    });
    return { promotions };
  }

  async getActivePromotions(restaurantId: number): Promise<{ promotions: Promotion[] }> {
    const now = new Date();
    const promotions = await this.promotionRepo
      .createQueryBuilder('p')
      .where('p.restaurantId = :restaurantId', { restaurantId })
      .andWhere('p.isActive = true')
      .andWhere('p.startDate <= :now', { now })
      .andWhere('p.endDate >= :now', { now })
      .orderBy('p.createdAt', 'DESC')
      .getMany();
    return { promotions };
  }

  async deletePromotion(id: number): Promise<{ success: boolean; message: string }> {
    const promo = await this.promotionRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Promoción no encontrada');
    await this.promotionRepo.delete(id);

    // Valida si hay o no promociones 
    const remaining = await this.getActivePromotions(promo.restaurantId);
    if (remaining.promotions.length === 0) {
      await this.restaurantRepo.update(promo.restaurantId, { hasActivePromotion: false });
    }

    return { success: true, message: 'Promoción eliminada' };
  }
  
  // CUPONES

  async createCoupon(data: {
    restaurantId: number;
    code: string;
    discountPercent: number;
    expiresAt: string;
    usageLimit?: number;
  }): Promise<Coupon> {
    // Validaciones de negocio
    if (data.discountPercent <= 0 || data.discountPercent > 100) {
      throw new BadRequestException('El porcentaje debe estar entre 1 y 100');
    }

    const expiry = new Date(data.expiresAt);
    if (expiry <= new Date()) {
      throw new BadRequestException('La fecha de expiración debe ser futura');
    }

    // Código único
    const existing = await this.couponRepo.findOne({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new BadRequestException(`El código "${data.code}" ya existe`);

    const coupon = this.couponRepo.create({
      ...data,
      code: data.code.toUpperCase(),
      expiresAt: expiry,
      status: 'PENDING_APPROVAL',
      usageCount: 0,
      isActive: false, // se activa cuando admin aprueba
    });
    return (await this.couponRepo.save(coupon)) as unknown as Coupon;
  }

  async getCouponsByRestaurant(restaurantId: number): Promise<{ coupons: Coupon[] }> {
    const coupons = await this.couponRepo.find({
      where: { restaurantId },
      order: { createdAt: 'DESC' },
    });
    return { coupons };
  }

  async getPendingCoupons(): Promise<{ coupons: Coupon[] }> {
    const coupons = await this.couponRepo.find({
      where: { status: 'PENDING_APPROVAL' },
      order: { createdAt: 'ASC' },
    });
    return { coupons };
  }

  async approveCoupon(couponId: number): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    coupon.status = 'APPROVED';
    coupon.isActive = true;
    return (await this.couponRepo.save(coupon)) as unknown as Coupon;
  }

  async rejectCoupon(couponId: number, reason: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    coupon.status = 'REJECTED';
    coupon.isActive = false;
    coupon.rejectionReason = reason;
    return (await this.couponRepo.save(coupon)) as unknown as Coupon;
  }

  // Validacion para el cupon, para ver si existe el codigo
  // para aprobarlo y ver si esta activo 
  //si ya se expiro
  //si ya se uso
  //si es el del restaurante que se dijo que era el correcto 
  //calcula el descuento sobre el total de la orden

  async validateCoupon(data: {
    code: string;
    restaurantId: number;
    orderTotal: number;
  }): Promise<{
    valid: boolean;
    message: string;
    discountPercent: number;
    discountAmount: number;
    finalTotal: number;
    couponId: number;
  }> {
    const coupon = await this.couponRepo.findOne({
      where: { code: data.code.toUpperCase() },
    });

    const zero = { valid: false, discountPercent: 0, discountAmount: 0, finalTotal: data.orderTotal, couponId: 0 };

    if (!coupon) return { ...zero, message: 'Código de cupón no válido' };
    if (coupon.restaurantId !== data.restaurantId) return { ...zero, message: 'Este cupón no aplica para este restaurante' };
    if (coupon.status !== 'APPROVED') return { ...zero, message: 'Este cupón no ha sido aprobado aún' };
    if (!coupon.isActive) return { ...zero, message: 'Cupón inactivo' };
    if (new Date() > coupon.expiresAt) return { ...zero, message: 'El cupón ha expirado' };
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { ...zero, message: 'El cupón ha alcanzado su límite de usos' };
    }

    // Cálculo matemático del descuento
    const discountAmount = parseFloat(((data.orderTotal * coupon.discountPercent) / 100).toFixed(2));
    const finalTotal = parseFloat((data.orderTotal - discountAmount).toFixed(2));

    return {
      valid: true,
      message: `Cupón aplicado: ${coupon.discountPercent}% de descuento`,
      discountPercent: coupon.discountPercent,
      discountAmount,
      finalTotal,
      couponId: coupon.id,
    };
  }

  // Se llama al confirmar la orden para incrementar el uso del cupón
  async incrementCouponUsage(couponId: number): Promise<void> {
    await this.couponRepo.increment({ id: couponId }, 'usageCount', 1);
  }
}