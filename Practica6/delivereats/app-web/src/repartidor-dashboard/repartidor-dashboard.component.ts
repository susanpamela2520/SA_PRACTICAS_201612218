import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-repartidor-dashboard',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './repartidor-dashboard.component.html',
  styleUrl: './repartidor-dashboard.component.scss',
})
export class RepartidorDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public router = inject(Router);

  orders = signal<any[]>([]);
  loading = signal(true);
  error = signal('');

  private apiUrl = 'http://localhost:3000';

  ngOnInit() { this.loadOrders(); }

  private getHeaders() {
    return new HttpHeaders({ Authorization: `Bearer ${localStorage.getItem('token')}` });
  }

  loadOrders() {
    this.loading.set(true);
    this.error.set('');
    this.http.get<any>(`${this.apiUrl}/orders/by-status/PREPARING`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => { this.orders.set(res.orders || []); this.loading.set(false); },
        error: () => {
          this.error.set('Error al cargar órdenes');
          this.loading.set(false);
        },
      });
  }

  goToDelivery(orderId: number) {
    this.router.navigate(['/delivery', orderId]);
  }

  takeOrder(orderId: number) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
    this.http.patch<any>(`${this.apiUrl}/orders/${orderId}/status`,
      { status: 'OUT_FOR_DELIVERY' }, { headers })
      .subscribe({
        next: () => this.router.navigate(['/delivery', orderId]),
        error: () => this.loadOrders(),
      });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      PREPARING: '#f59e0b',
      OUT_FOR_DELIVERY: '#3b82f6',
      DELIVERED: '#10b981',
      FAILED: '#ef4444',
    };
    return colors[status] || '#94a3b8';
  }
}