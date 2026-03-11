// restaurant-service/src/restaurant/promotion-coupon.controller.ts — CREAR NUEVO
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PromotionCouponService } from './promotion-coupon.service';

@Controller()
export class PromotionCouponController {
  constructor(private readonly pcService: PromotionCouponService) {}

  // activa y desactiva la promocion
  @GrpcMethod('RestaurantService', 'CreatePromotion')
  createPromotion(data: any) { return this.pcService.createPromotion(data); }

  @GrpcMethod('RestaurantService', 'GetPromotionsByRestaurant')
  getPromotionsByRestaurant(data: { restaurantId: number }) {
    return this.pcService.getPromotionsByRestaurant(data.restaurantId);
  }

  @GrpcMethod('RestaurantService', 'GetActivePromotions')
  getActivePromotions(data: { restaurantId: number }) {
    return this.pcService.getActivePromotions(data.restaurantId);
  }

  @GrpcMethod('RestaurantService', 'DeletePromotion')
  deletePromotion(data: { id: number }) { return this.pcService.deletePromotion(data.id); }

  //  funciona para activar y desactivar un cupon 
  @GrpcMethod('RestaurantService', 'CreateCoupon')
  createCoupon(data: any) { return this.pcService.createCoupon(data); }

  @GrpcMethod('RestaurantService', 'GetCouponsByRestaurant')
  getCouponsByRestaurant(data: { restaurantId: number }) {
    return this.pcService.getCouponsByRestaurant(data.restaurantId);
  }

  @GrpcMethod('RestaurantService', 'GetPendingCoupons')
  getPendingCoupons() { return this.pcService.getPendingCoupons(); }

  @GrpcMethod('RestaurantService', 'ApproveCoupon')
  approveCoupon(data: { couponId: number }) { return this.pcService.approveCoupon(data.couponId); }

  @GrpcMethod('RestaurantService', 'RejectCoupon')
  rejectCoupon(data: { couponId: number; reason: string }) {
    return this.pcService.rejectCoupon(data.couponId, data.reason);
  }

  @GrpcMethod('RestaurantService', 'ValidateCoupon')
  validateCoupon(data: { code: string; restaurantId: number; orderTotal: number }) {
    return this.pcService.validateCoupon(data);
  }
}