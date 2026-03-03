import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { RestaurantService } from '../restaurant.service';
import { CartService } from '../../order/cart.service';
import { MenuItem } from '../intefaces/menu.interface';

@Component({
  selector: 'app-order-view',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './order-view.component.html',
  styleUrl: './order-view.component.scss',
})
export class OrderViewComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private restaurantService = inject(RestaurantService);
  private snack = inject(MatSnackBar);
  private http = inject(HttpClient);

  cart = inject(CartService);

  // Signals de la vista
  menuItems = signal<MenuItem[]>([]);
  restaurantName = signal<string>('');
  restaurantId = signal<number>(0);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // Controla si el drawer está abierto
  isCartOpen = signal<boolean>(false);

  // Feedback visual al agregar ítem
  addedFeedback = signal<Set<number>>(new Set());

  // Signals del drawer
  orderLoading = signal(false);
  orderError = signal('');

  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.restaurantId.set(Number(id));
      this.loadMenu(Number(id));
    }

    const nav = this.router.getCurrentNavigation();
    const nombre = nav?.extras?.state?.['restaurantName'];
    if (nombre) this.restaurantName.set(nombre);
  }

  loadMenu(id: number) {
    this.loading.set(true);
    this.restaurantService.getMenu(id).subscribe({
      next: (res: any) => {
        this.menuItems.set(res.menuItems || res.items || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el menú.');
        this.loading.set(false);
      },
    });
  }

  addToCart(item: MenuItem) {
    this.cart.addToCart(
      item,
      this.restaurantId(),
      this.restaurantName() || `Restaurante #${this.restaurantId()}`,
    );

    if (this.cart.mixedWarning()) return;

    const current = new Set(this.addedFeedback());
    current.add(item.id!);
    this.addedFeedback.set(current);

    setTimeout(() => {
      const updated = new Set(this.addedFeedback());
      updated.delete(item.id!);
      this.addedFeedback.set(updated);
    }, 1200);

    this.snack.open(`${item.name} agregado`, '✓', { duration: 1500 });
  }

  clearAndContinue() {
    this.cart.clearCart();
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  // Confirmar orden desde el drawer
  confirmOrder() {
    const restaurantId = this.cart.restaurantId();
    const items = this.cart.items();
    if (!restaurantId || items.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.orderError.set('Debes iniciar sesión.');
      return;
    }

    this.orderLoading.set(true);
    this.orderError.set('');

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const payload = {
      restaurantId,
      items: items.map((i) => ({
        menuItemId: i.id,
        quantity: i.quantity,
        price: i.price,
      })),
    };

    this.http.post<any>(`${this.apiUrl}/orders`, payload, { headers })
      .subscribe({
        next: (order) => {
          this.orderLoading.set(false);
          this.cart.clearCart();
          this.isCartOpen.set(false);
          this.router.navigate(['/order-success', order.id]);
        },
        error: (err) => {
          this.orderLoading.set(false);
          this.orderError.set(
            err?.error?.message || 'Error al crear la orden.',
          );
        },
      });
  }
}