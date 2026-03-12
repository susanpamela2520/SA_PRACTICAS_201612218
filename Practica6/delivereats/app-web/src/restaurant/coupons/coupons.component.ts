// app-web/src/restaurant/coupons/coupons.component.ts — CREAR NUEVO
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-coupons',
  standalone: true,
  imports: [SharedModule, FormsModule, CommonModule],
  templateUrl: './coupons.component.html',
  styleUrl: './coupons.component.scss',
})
export class CouponsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  restaurantId = signal<number>(0);
  coupons = signal<any[]>([]);
  loading = signal(false);
  showForm = signal(false);

  form = this.emptyForm();
  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('restaurantId');
    if (id) { this.restaurantId.set(Number(id)); this.loadCoupons(); }
  }

  emptyForm() {
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    return { code: '', discountPercent: 10, expiresAt: nextMonth.toISOString().slice(0, 16), usageLimit: 0 };
  }

  loadCoupons() {
    this.loading.set(true);
    const headers = new HttpHeaders({ Authorization: 'Bearer ' + localStorage.getItem('token') });
    this.http.get<any>(`${this.apiUrl}/restaurants/${this.restaurantId()}/coupons`, { headers })
      .subscribe({
        next: (res) => { this.coupons.set(res.coupons || []); this.loading.set(false); },
        error: () => { this.snack.open('Error al cargar cupones', 'OK', { duration: 3000 }); this.loading.set(false); },
      });
  }

  createCoupon() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token'),
    });
    const payload = { ...this.form, code: this.form.code.toUpperCase() };
    this.http.post<any>(`${this.apiUrl}/restaurants/${this.restaurantId()}/coupons`, payload, { headers })
      .subscribe({
        next: () => {
          this.snack.open('Cupón creado — pendiente aprobación del administrador', 'OK', { duration: 4000 });
          this.showForm.set(false);
          this.form = this.emptyForm();
          this.loadCoupons();
        },
        error: (e) => this.snack.open(e?.error?.message || 'Error al crear', 'OK', { duration: 3000 }),
      });
  }

  getStatusColor(status: string): string {
    return { APPROVED: 'accent', REJECTED: 'warn', PENDING_APPROVAL: '' }[status] || '';
  }

  getStatusLabel(status: string): string {
    return { APPROVED: '✅ Aprobado', REJECTED: '❌ Rechazado', PENDING_APPROVAL: '⏳ Pendiente' }[status] || status;
  }

  isExpired(expiresAt: string): boolean { return new Date(expiresAt) < new Date(); }
}