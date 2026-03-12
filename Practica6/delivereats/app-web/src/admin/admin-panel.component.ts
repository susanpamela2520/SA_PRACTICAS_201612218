import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Order {
  id: number;
  userId: number;
  restaurantId: number;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryPhoto: string;
  deliveryFailedReason: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [SharedModule, CommonModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  private http = inject(HttpClient);

  // ─── ÓRDENES ──────────────────────────────────────────────
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  selectedPhoto = signal<string | null>(null);
  refunding = signal<number | null>(null);

  // ─── CUPONES ──────────────────────────────────────────────
  pendingCoupons = signal<any[]>([]);
  couponsLoading = signal(false);
  rejectReasons: Record<number, string> = {};

  // ─── TABS ─────────────────────────────────────────────────
  activeTab: 'orders' | 'coupons' = 'orders';

  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    this.loadFinishedOrders();
  }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
  }

  // ─── ÓRDENES ──────────────────────────────────────────────
  loadFinishedOrders() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/admin/orders/finished`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => { this.orders.set(res.orders || []); this.loading.set(false); },
        error: () => { this.error.set('No se pudieron cargar las órdenes.'); this.loading.set(false); },
      });
  }

  viewPhoto(photo: string) { this.selectedPhoto.set(photo); }
  closePhoto() { this.selectedPhoto.set(null); }

  approveRefund(orderId: number) {
    this.refunding.set(orderId);
    this.http.post<any>(`${this.apiUrl}/admin/orders/${orderId}/refund`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => {
          this.refunding.set(null);
          this.orders.update(orders =>
            orders.map(o => o.id === orderId ? { ...o, paymentStatus: 'REFUNDED' } : o)
          );
        },
        error: () => this.refunding.set(null),
      });
  }

  // ─── CUPONES ──────────────────────────────────────────────
  loadPendingCoupons() {
    this.couponsLoading.set(true);
    this.http.get<any>(`${this.apiUrl}/restaurants/coupons/pending`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => { this.pendingCoupons.set(res.coupons || []); this.couponsLoading.set(false); },
        error: () => this.couponsLoading.set(false),
      });
  }

  approveCoupon(id: number) {
    this.http.post<any>(`${this.apiUrl}/restaurants/coupons/${id}/approve`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: () => { this.loadPendingCoupons(); },
        error: () => {},
      });
  }

  rejectCoupon(id: number) {
    const reason = this.rejectReasons[id] || '';
    this.http.post<any>(`${this.apiUrl}/restaurants/coupons/${id}/reject`, { reason }, { headers: this.getHeaders() })
      .subscribe({
        next: () => { this.loadPendingCoupons(); },
        error: () => {},
      });
  }

  // ─── COLORES ──────────────────────────────────────────────
  statusColor(status: string): string {
    const colors: Record<string, string> = {
      DELIVERED: 'green', FAILED: 'red', PENDING: 'orange',
      PREPARING: 'blue', OUT_FOR_DELIVERY: 'purple',
    };
    return colors[status] || 'gray';
  }

  paymentColor(status: string): string {
    const colors: Record<string, string> = {
      PAID: 'green', UNPAID: 'orange', REFUNDED: 'blue', FAILED: 'red',
    };
    return colors[status] || 'gray';
  }
}