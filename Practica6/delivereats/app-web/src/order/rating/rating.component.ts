import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [SharedModule, FormsModule, CommonModule],
  template: `
    <div class="rating-container">
      <mat-card class="rating-card">
        <mat-card-header>
          <mat-card-title>‚≠ê Califica tu experiencia</mat-card-title>
          <mat-card-subtitle>Orden #{{ orderId() }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="section">
            <p class="label">ÌΩΩÔ∏è Calidad del restaurante</p>
            <div class="stars">
              <button *ngFor="let s of [1,2,3,4,5]" class="star-btn"
                [class.active]="ratingRestaurant >= s" (click)="ratingRestaurant = s">‚òÖ</button>
            </div>
          </div>
          <div class="section">
            <p class="label">Ìªµ Servicio de entrega</p>
            <div class="stars">
              <button *ngFor="let s of [1,2,3,4,5]" class="star-btn"
                [class.active]="ratingDelivery >= s" (click)="ratingDelivery = s">‚òÖ</button>
            </div>
          </div>
          <div class="section">
            <p class="label">ÌΩï Calidad del producto</p>
            <div class="stars">
              <button *ngFor="let s of [1,2,3,4,5]" class="star-btn"
                [class.active]="ratingProduct >= s" (click)="ratingProduct = s">‚òÖ</button>
            </div>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Comentario (opcional)</mat-label>
            <textarea matInput [(ngModel)]="comment" rows="3"></textarea>
          </mat-form-field>
          <div class="error-msg" *ngIf="error()"><mat-icon>error_outline</mat-icon> {{ error() }}</div>
          <div class="success-msg" *ngIf="success()"><mat-icon>check_circle</mat-icon> ¬°Gracias por tu calificaci√≥n!</div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" class="submit-btn"
            [disabled]="loading() || success() || !ratingRestaurant" (click)="submit()">
            <mat-icon>star</mat-icon> {{ loading() ? 'Enviando...' : 'Enviar Calificaci√≥n' }}
          </button>
          <button mat-button (click)="router.navigate(['/dashboard'])">
            {{ success() ? 'Volver al inicio' : 'Omitir' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .rating-container { max-width: 500px; margin: 40px auto; padding: 0 16px; }
    .rating-card { border-radius: 20px !important; }
    .section { margin-bottom: 20px; }
    .label { font-weight: 600; color: #475569; margin: 0 0 8px; }
    .stars { display: flex; gap: 4px; }
    .star-btn { font-size: 2rem; background: none; border: none; cursor: pointer; color: #cbd5e1; line-height: 1; }
    .star-btn.active { color: #f59e0b; }
    .full-width { width: 100%; margin-top: 8px; }
    .error-msg { display:flex; align-items:center; gap:8px; background:#fef2f2; color:#dc2626; padding:10px 14px; border-radius:10px; }
    .success-msg { display:flex; align-items:center; gap:8px; background:#f0fdf4; color:#16a34a; padding:10px 14px; border-radius:10px; font-weight:600; }
    mat-card-actions { display:flex; flex-direction:column; gap:8px; padding:8px 16px 16px !important; }
    .submit-btn { width:100%; height:48px; }
  `],
})
export class RatingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private http = inject(HttpClient);

  orderId = signal(0);
  restaurantId = signal(0);
  loading = signal(false);
  error = signal('');
  success = signal(false);

  ratingRestaurant = 0;
  ratingDelivery = 0;
  ratingProduct = 0;
  comment = '';

  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    this.orderId.set(Number(this.route.snapshot.paramMap.get('orderId')));
    this.restaurantId.set(Number(this.route.snapshot.queryParamMap.get('restaurantId') || 0));
  }

  submit() {
    if (!this.ratingRestaurant) { this.error.set('Califica al menos el restaurante'); return; }
    this.loading.set(true);
    this.error.set('');
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });
    this.http.post(`${this.apiUrl}/orders/rate`, {
      orderId: this.orderId(), restaurantId: this.restaurantId(),
      ratingRestaurant: this.ratingRestaurant, ratingDelivery: this.ratingDelivery,
      ratingProduct: this.ratingProduct, comment: this.comment,
    }, { headers }).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Error al enviar'); },
    });
  }
}
