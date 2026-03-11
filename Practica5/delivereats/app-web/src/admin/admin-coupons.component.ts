import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [SharedModule, FormsModule, CommonModule],
  template: `
<div class="admin-coupons-container">
  <div class="page-header">
    <button mat-icon-button routerLink="/admin"><mat-icon>arrow_back</mat-icon></button>
    <div>
      <h1>Aprobación de Cupones</h1>
      <p class="subtitle">Revisar y aprobar cupones de descuento enviados por restaurantes</p>
    </div>
  </div>

  <div class="loading-spinner" *ngIf="loading()"><mat-spinner diameter="40"></mat-spinner></div>

  <div class="empty-state" *ngIf="!loading() && pendingCoupons().length === 0">
    <mat-icon>check_circle</mat-icon>
    <p>No hay cupones pendientes de aprobación.</p>
  </div>

  <div class="coupons-review-list" *ngIf="!loading()">
    <mat-card class="review-card" *ngFor="let c of pendingCoupons()">
      <mat-card-header>
        <mat-card-title class="coupon-code-title">{{ c.code }}</mat-card-title>
        <mat-card-subtitle>Restaurante #{{ c.restaurantId }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="info-grid">
          <div><mat-icon>percent</mat-icon> <strong>{{ c.discountPercent }}%</strong> de descuento</div>
          <div><mat-icon>event</mat-icon> Vence: {{ c.expiresAt | date:'dd/MM/yyyy HH:mm' }}</div>
          <div><mat-icon>bar_chart</mat-icon> Límite: {{ c.usageLimit || 'Ilimitado' }} usos</div>
          <div><mat-icon>calendar_today</mat-icon> Creado: {{ c.createdAt | date:'dd/MM/yyyy' }}</div>
        </div>
      </mat-card-content>

      <mat-card-actions class="action-row">
        <button mat-raised-button color="accent" (click)="approveCoupon(c.id)">
          <mat-icon>check_circle</mat-icon> Aprobar
        </button>
        <div class="reject-section">
          <mat-form-field appearance="outline" class="reason-field">
            <mat-label>Razón de rechazo</mat-label>
            <input matInput [(ngModel)]="rejectReasons[c.id]" placeholder="Opcional">
          </mat-form-field>
          <button mat-raised-button color="warn" (click)="rejectCoupon(c.id)">
            <mat-icon>cancel</mat-icon> Rechazar
          </button>
        </div>
      </mat-card-actions>
    </mat-card>
  </div>
</div>
  `,
  styles: [`
    .admin-coupons-container { padding: 24px; max-width: 800px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .coupon-code-title { font-size: 1.4rem; font-weight: 700; letter-spacing: 2px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
    .info-grid div { display: flex; align-items: center; gap: 8px; }
    .action-row { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
    .reject-section { display: flex; align-items: center; gap: 12px; width: 100%; }
    .reason-field { flex: 1; }
    .review-card { margin-bottom: 16px; }
    .empty-state { text-align: center; padding: 40px; color: #666; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #4caf50; }
  `]
})
export class AdminCouponsComponent implements OnInit {
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  pendingCoupons = signal<any[]>([]);
  loading = signal(false);
  rejectReasons: Record<number, string> = {};

  private apiUrl = 'http://localhost:3000';

  ngOnInit() { this.loadPending(); }

  loadPending() {
    this.loading.set(true);
    const headers = new HttpHeaders({ Authorization: 'Bearer ' + localStorage.getItem('token') });
    this.http.get<any>(`${this.apiUrl}/restaurants/coupons/pending`, { headers })
      .subscribe({
        next: (res) => { this.pendingCoupons.set(res.coupons || []); this.loading.set(false); },
        error: () => { this.snack.open('Error al cargar', 'OK', { duration: 3000 }); this.loading.set(false); },
      });
  }

  approveCoupon(id: number) {
    const headers = new HttpHeaders({ Authorization: 'Bearer ' + localStorage.getItem('token') });
    this.http.post<any>(`${this.apiUrl}/restaurants/coupons/${id}/approve`, {}, { headers })
      .subscribe({
        next: () => { this.snack.open('Cupón aprobado ✅', 'OK', { duration: 3000 }); this.loadPending(); },
        error: () => this.snack.open('Error al aprobar', 'OK', { duration: 3000 }),
      });
  }

  rejectCoupon(id: number) {
    const reason = this.rejectReasons[id] || '';
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') });
    this.http.post<any>(`${this.apiUrl}/restaurants/coupons/${id}/reject`, { reason }, { headers })
      .subscribe({
        next: () => { this.snack.open('Cupón rechazado', 'OK', { duration: 3000 }); this.loadPending(); },
        error: () => this.snack.open('Error al rechazar', 'OK', { duration: 3000 }),
      });
  }
}