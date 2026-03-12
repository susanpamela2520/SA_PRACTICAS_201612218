import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Promotion {
  id?: number;
  title: string;
  description?: string;
  type: 'percentage' | 'combo';
  discountPercent?: number;
  comboDescription?: string;
  comboPrice?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [SharedModule, FormsModule, CommonModule],
  templateUrl: './promotions.component.html',
  styleUrl: './promotions.component.scss',
})
export class PromotionsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  restaurantId = signal<number>(0);
  promotions = signal<Promotion[]>([]);
  loading = signal(false);
  showForm = signal(false);

  form: Promotion = this.emptyForm();

  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('restaurantId');
    if (id) {
      this.restaurantId.set(Number(id));
      this.loadPromotions();
    }
  }

  emptyForm(): Promotion {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    return {
      title: '', description: '', type: 'percentage',
      discountPercent: 10, comboDescription: '', comboPrice: 0,
      startDate: tomorrow.toISOString().slice(0, 16),
      endDate: nextWeek.toISOString().slice(0, 16),
    };
  }

  loadPromotions() {
  this.loading.set(true);
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  const url = this.isCliente
    ? `${this.apiUrl}/restaurants/${this.restaurantId()}/promotions/active`
    : `${this.apiUrl}/restaurants/${this.restaurantId()}/promotions`;
  this.http.get<any>(url, { headers }).subscribe({
    next: (res) => { this.promotions.set(res.promotions || []); this.loading.set(false); },
    error: () => this.loading.set(false),
  });
}

  createPromotion() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + localStorage.getItem('token'),
    });
    this.http.post<any>(`${this.apiUrl}/restaurants/${this.restaurantId()}/promotions`, this.form, { headers })
      .subscribe({
        next: () => {
          this.snack.open('Promoción creada', 'OK', { duration: 3000 });
          this.showForm.set(false);
          this.form = this.emptyForm();
          this.loadPromotions();
        },
        error: (e) => this.snack.open(e?.error?.message || 'Error al crear', 'OK', { duration: 3000 }),
      });
  }

  deletePromotion(id: number) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    const headers = new HttpHeaders({ Authorization: 'Bearer ' + localStorage.getItem('token') });
    this.http.delete<any>(`${this.apiUrl}/restaurants/promotions/${id}`, { headers })
      .subscribe({
        next: () => { this.snack.open('Promoción eliminada', 'OK', { duration: 3000 }); this.loadPromotions(); },
        error: () => this.snack.open('Error al eliminar', 'OK', { duration: 3000 }),
      });
  }

  isExpired(endDate: string): boolean {
    return new Date(endDate) < new Date();
  }

  get isCliente(): boolean {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    return JSON.parse(atob(token.split('.')[1])).role === 'Cliente';
  } catch { return false; }
}

}