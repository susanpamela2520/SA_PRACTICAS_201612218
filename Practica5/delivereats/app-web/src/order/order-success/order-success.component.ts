// src/order/order-success/order-success.component.ts — REEMPLAZAR
// CAMBIO: ahora redirige a /payment/:id en lugar de ir directo al dashboard
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="success-container">
      <mat-card class="success-card">
        <mat-card-content>
          <div class="success-content">
            <span class="success-emoji">🎉</span>
            <h2>¡Orden creada!</h2>
            <p class="subtitle">Tu pedido #{{ orderId() }} fue enviado al restaurante</p>

            <div class="status-badge">
              <mat-icon color="primary">hourglass_empty</mat-icon>
              <span>Estado: <strong>PENDIENTE</strong></span>
            </div>

            <p class="queue-msg">
              <mat-icon>check_circle</mat-icon>
              El restaurante recibió tu orden
            </p>

            <p class="pay-msg">Ahora completa tu pago para confirmar el pedido</p>

            <div class="actions">
              <button mat-raised-button color="primary" (click)="goToPayment()">
                <mat-icon>payment</mat-icon>
                Pagar Q{{ total() | number:'1.2-2' }}
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .success-container {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%);
      padding: 16px;
    }
    .success-card { max-width: 460px; width: 100%; border-radius: 20px !important; }
    .success-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 16px 8px; }
    .success-emoji { font-size: 5rem; margin-bottom: 12px; }
    h2 { font-weight: 700; font-size: 1.8rem; margin: 0 0 8px; }
    .subtitle { color: #666; margin: 0 0 20px; }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; background: #e3f2fd; padding: 8px 20px; border-radius: 24px; margin-bottom: 16px; }
    .queue-msg { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #4caf50; margin-bottom: 8px; }
    .pay-msg { color: #1976d2; font-weight: 500; margin-bottom: 20px; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  `],
})
export class OrderSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orderId = signal<number>(0);
  total = signal<number>(0);

  ngOnInit() {
    this.orderId.set(Number(this.route.snapshot.paramMap.get('id')));
    this.total.set(Number(this.route.snapshot.queryParamMap.get('total') || 0));
  }

  goToPayment() {
    this.router.navigate(['/payment', this.orderId()], {
      queryParams: { total: this.total() }
    });
  }
}