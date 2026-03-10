import {
  Component, inject, signal, OnInit, OnDestroy,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';
import {
  RestaurantOrder,
  RestaurantOrderListResponse,
} from './order-inbox.interface';
import { RejectDialogComponent } from './reject-dialog.component';

@Component({
  selector: 'app-order-inbox',
  standalone: true,
  imports: [SharedModule, RouterLink],
  templateUrl: './order-inbox.component.html',
  styleUrl: './order-inbox.component.scss',
})
export class OrderInboxComponent implements OnInit, OnDestroy {
  private http     = inject(HttpClient);
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private snack    = inject(MatSnackBar);
  private dialog   = inject(MatDialog);

  private apiUrl      = 'http://localhost:3000';
  private pollTimer: any;
  private readonly POLL_INTERVAL = 10_000; // refresca cada 10 seg

  restaurantId = signal<number>(0);
  orders       = signal<RestaurantOrder[]>([]);
  loading      = signal(false);
  processing   = signal<number | null>(null); // orderId en proceso

  // ── filtro de vista ───────────────────────────────────────
  activeTab = signal<'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ALL'>('PENDING');

  get filteredOrders(): RestaurantOrder[] {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.orders();
    return this.orders().filter(o => o.status === tab);
  }

  get pendingCount(): number {
    return this.orders().filter(o => o.status === 'PENDING').length;
  }

  // ── lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('restaurantId');
    if (!id) { this.router.navigate(['/dashboard']); return; }

    this.restaurantId.set(Number(id));
    this.loadOrders();

    // polling automático
    this.pollTimer = setInterval(() => this.loadOrders(), this.POLL_INTERVAL);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollTimer);
  }

  // ── carga de órdenes ──────────────────────────────────────
  loadOrders(): void {
    const headers = this.authHeaders();
    if (!headers) return;

    this.loading.set(true);
    this.http
      .get<RestaurantOrderListResponse>(
        `${this.apiUrl}/restaurants/${this.restaurantId()}/orders`,
        { headers },
      )
      .subscribe({
        next: (res) => {
          // ordenar: PENDING primero, luego por fecha desc
          const sorted = [...(res.orders ?? [])].sort((a, b) => {
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (b.status === 'PENDING' && a.status !== 'PENDING') return  1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          this.orders.set(sorted);
          this.loading.set(false);
        },
        error: () => {
          this.showMsg('Error al cargar las órdenes', true);
          this.loading.set(false);
        },
      });
  }

  // ── aceptar orden ─────────────────────────────────────────
  acceptOrder(order: RestaurantOrder): void {
    const headers = this.authHeaders();
    if (!headers) return;

    this.processing.set(order.orderId);

    this.http
      .post<any>(
        `${this.apiUrl}/restaurants/orders/${order.orderId}/accept`,
        { restaurantId: this.restaurantId() },
        { headers },
      )
      .subscribe({
        next: () => {
          this.showMsg(`✅ Orden #${order.orderId} aceptada. El restaurante comenzará a prepararla.`);
          this.processing.set(null);
          this.loadOrders();
        },
        error: (err) => {
          this.showMsg(err?.error?.message || 'Error al aceptar la orden', true);
          this.processing.set(null);
        },
      });
  }

  // ── rechazar orden (abre diálogo para pedir razón) ────────
  rejectOrder(order: RestaurantOrder): void {
    const dialogRef = this.dialog.open(RejectDialogComponent, {
      width: '420px',
      data: { orderId: order.orderId },
    });

    dialogRef.afterClosed().subscribe((reason: string | undefined) => {
      if (reason === undefined) return; // usuario canceló

      const headers = this.authHeaders();
      if (!headers) return;

      this.processing.set(order.orderId);

      this.http
        .post<any>(
          `${this.apiUrl}/restaurants/orders/${order.orderId}/reject`,
          { restaurantId: this.restaurantId(), reason },
          { headers },
        )
        .subscribe({
          next: () => {
            this.showMsg(`❌ Orden #${order.orderId} rechazada. El cliente será notificado.`);
            this.processing.set(null);
            this.loadOrders();
          },
          error: (err) => {
            this.showMsg(err?.error?.message || 'Error al rechazar la orden', true);
            this.processing.set(null);
          },
        });
    });
  }

  // ── helpers ───────────────────────────────────────────────
  orderTotal(order: RestaurantOrder): number {
    return Number(order.total);
  }

  isProcessing(orderId: number): boolean {
    return this.processing() === orderId;
  }

  trackById(_: number, item: RestaurantOrder): number {
    return item.id;
  }

  private authHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return null;
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  private showMsg(msg: string, isError = false): void {
    this.snack.open(msg, 'OK', {
      duration: 4000,
      panelClass: isError ? ['snack-error'] : ['snack-success'],
    });
  }
}