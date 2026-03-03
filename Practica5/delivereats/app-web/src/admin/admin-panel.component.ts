// src/admin/admin-panel/admin-panel.component.ts
// Panel ADMINISTRADOR: ve órdenes finalizadas, fotos de entrega y aprueba reembolsos
import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

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
  imports: [SharedModule],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss',
})
export class AdminPanelComponent implements OnInit {
  private http = inject(HttpClient);

  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal('');
  selectedPhoto = signal<string | null>(null);
  refunding = signal<number | null>(null);

  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    this.loadFinishedOrders();
  }

  loadFinishedOrders() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>(`${this.apiUrl}/admin/orders/finished`, { headers }).subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las órdenes.');
        this.loading.set(false);
      },
    });
  }

  viewPhoto(photo: string) {
    this.selectedPhoto.set(photo);
  }

  closePhoto() {
    this.selectedPhoto.set(null);
  }

  approveRefund(orderId: number) {
    this.refunding.set(orderId);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http.post<any>(`${this.apiUrl}/admin/orders/${orderId}/refund`, {}, { headers })
      .subscribe({
        next: () => {
          this.refunding.set(null);
          // Actualizar la orden en el listado local
          this.orders.update(orders =>
            orders.map(o => o.id === orderId
              ? { ...o, paymentStatus: 'REFUNDED' }
              : o
            )
          );
        },
        error: () => this.refunding.set(null),
      });
  }

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
