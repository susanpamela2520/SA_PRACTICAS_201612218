export interface Restaurant {
  id?: number;
  name: string;
  address: string;
  category: string;
  horario: string;
  calificacion?: string;
  avgRating?: number;
  totalSales?: number;
  hasActivePromotion?: boolean;
  createdAt?: string;
}

export interface RestaurantResponse {
  restaurants?: Restaurant[];
  id?: number;
  name?: string;
  address?: string;
  category?: string;
  success?: boolean;
  message?: string;
}

export interface FilterParams {
  category?: string;
  sortBy?: string;
  onlyWithPromotion?: boolean;
  search?: string;
}