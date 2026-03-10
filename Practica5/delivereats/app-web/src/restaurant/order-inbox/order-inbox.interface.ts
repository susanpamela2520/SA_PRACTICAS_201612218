// src/restaurant/order-inbox/order-inbox.interface.ts
export interface OrderItemSnapshot {
  menuItemId: number;
  quantity: number;
  price: number;
}

export interface RestaurantOrder {
  id: number;
  orderId: number;
  restaurantId: number;
  userId: number;
  total: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  items: OrderItemSnapshot[];
}

export interface RestaurantOrderListResponse {
  orders: RestaurantOrder[];
}