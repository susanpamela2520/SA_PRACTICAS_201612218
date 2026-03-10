export interface OrderItemSnapshot {
  menuItemId: number;
  quantity: number;
  price: number;
}

export interface RestaurantOrder {
  id: number;
  orderId: number;        // ID en order-service
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