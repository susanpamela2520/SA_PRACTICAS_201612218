// src/order/payment/payment.component.ts
// Vista donde el cliente paga su orden
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  orderId = signal<number>(0);
  orderTotal = signal<number>(0);
  loading = signal(false);
  error = signal('');
  success = signal(false);
  transactionCode = signal('');
  paymentMethod = signal<'card' | 'wallet'>('card');

  // Tasa de cambio GTQ → USD
  exchangeRate = signal<number | null>(null);
  loadingRate = signal(false);

  private apiUrl = 'http://localhost:3000';

  cardForm = this.fb.group({
    cardHolder: ['', Validators.required],
    cardNumber: ['', [Validators.required, Validators.minLength(16), Validators.maxLength(16)]],
    expiry: ['', Validators.required],
    cvv: ['', [Validators.required, Validators.minLength(3)]],
  });

  walletForm = this.fb.group({
    walletAlias: ['', Validators.required],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('orderId');
    const total = this.route.snapshot.queryParamMap.get('total');
    this.orderId.set(Number(id));
    this.orderTotal.set(Number(total) || 0);
    this.loadExchangeRate();
  }

  loadExchangeRate() {
    this.loadingRate.set(true);
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any>(`${this.apiUrl}/fx/rate?from=GTQ&to=USD`, { headers }).subscribe({
      next: (res) => {
        this.exchangeRate.set(res.rate);
        this.loadingRate.set(false);
      },
      error: () => this.loadingRate.set(false),
    });
  }

  get usdAmount(): string {
    const rate = this.exchangeRate();
    if (!rate) return '—';
    return (this.orderTotal() * rate).toFixed(2);
  }

  pay() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    let payload: any = {
      orderId: this.orderId(),
      amount: this.orderTotal(),
      method: this.paymentMethod() === 'card' ? 'CREDIT_CARD' : 'DIGITAL_WALLET',
    };

    if (this.paymentMethod() === 'card') {
      if (this.cardForm.invalid) return;
      const cardNum = this.cardForm.value.cardNumber || '';
      payload = {
        ...payload,
        cardHolder: this.cardForm.value.cardHolder,
        cardLastFour: cardNum.slice(-4),
      };
    } else {
      if (this.walletForm.invalid) return;
      payload.walletAlias = this.walletForm.value.walletAlias;
    }

    this.loading.set(true);
    this.error.set('');

    this.http.post<any>(`${this.apiUrl}/payments`, payload, { headers }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.status === 'COMPLETED') {
          this.success.set(true);
          this.transactionCode.set(res.transactionCode);
        } else {
          this.error.set('Pago rechazado. Verifica los datos e intenta de nuevo.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Error procesando el pago.');
      },
    });
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
