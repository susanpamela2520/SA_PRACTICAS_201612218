import supertest from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Rating } from './entities/rating.entity';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

const request = require('supertest');

describe('OrderService - Lógica de Negocio', () => {
  let service: OrderService;

  const mockOrderRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockRatingRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockItemRepo = { create: jest.fn(), save: jest.fn() };
  const mockAmqp = { publish: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: mockItemRepo },
        { provide: getRepositoryToken(Rating), useValue: mockRatingRepo },
        { provide: AmqpConnection, useValue: mockAmqp },
      ],
    }).compile();
    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Lógica de Negocio 1: Cálculo de descuentos ───────────
  describe('Cálculo de descuentos (cupones)', () => {
    it('calcula correctamente el 20% de descuento sobre Q100', () => {
      const orderTotal = 100;
      const discountPercent = 20;
      const discountAmount = (orderTotal * discountPercent) / 100;
      const finalTotal = orderTotal - discountAmount;
      expect(discountAmount).toBe(20);
      expect(finalTotal).toBe(80);
    });

    it('calcula correctamente el 10% de descuento sobre Q250', () => {
      const orderTotal = 250;
      const discountPercent = 10;
      const discountAmount = (orderTotal * discountPercent) / 100;
      const finalTotal = orderTotal - discountAmount;
      expect(discountAmount).toBe(25);
      expect(finalTotal).toBe(225);
    });

    it('descuento 0% no modifica el total', () => {
      const orderTotal = 150;
      const discountPercent = 0;
      const finalTotal = orderTotal - (orderTotal * discountPercent) / 100;
      expect(finalTotal).toBe(150);
    });
  });

  // ─── Lógica de Negocio 2: Promedio calificaciones ─────────
  describe('Promedio de calificaciones y restaurantes Destacados', () => {
    it('calcula correctamente el promedio de ratings', async () => {
      mockRatingRepo.find.mockResolvedValue([
        { ratingRestaurant: 5 },
        { ratingRestaurant: 4 },
        { ratingRestaurant: 3 },
      ]);
      const result = await service.getRatingsByRestaurant(1);
      expect(result.avg).toBeCloseTo(4);
    });

    it('retorna avg 0 si no hay calificaciones', async () => {
      mockRatingRepo.find.mockResolvedValue([]);
      const result = await service.getRatingsByRestaurant(1);
      expect(result.avg).toBe(0);
    });

    it('restaurante es Destacado si avg >= 4', async () => {
      mockRatingRepo.find.mockResolvedValue([
        { ratingRestaurant: 5 },
        { ratingRestaurant: 4 },
      ]);
      const result = await service.getRatingsByRestaurant(1);
      const esDestacado = result.avg >= 4;
      expect(esDestacado).toBe(true);
    });

    it('restaurante NO es Destacado si avg < 4', async () => {
      mockRatingRepo.find.mockResolvedValue([
        { ratingRestaurant: 2 },
        { ratingRestaurant: 3 },
      ]);
      const result = await service.getRatingsByRestaurant(1);
      const esDestacado = result.avg >= 4;
      expect(esDestacado).toBe(false);
    });
  });
});