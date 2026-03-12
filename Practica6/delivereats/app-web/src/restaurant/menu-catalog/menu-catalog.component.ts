// app-web/src/restaurant/menu-catalog/menu-catalog.component.ts — CREAR NUEVO
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../order/cart.service';
import { SharedModule } from '../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { CartDrawerComponent } from '../../cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-menu-catalog',
  standalone: true,
  imports: [SharedModule, CommonModule, CartDrawerComponent],
  templateUrl: './menu-catalog.component.html',
  styleUrl: './menu-catalog.component.scss',
})
export class MenuCatalogComponent implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private http = inject(HttpClient);
  cart = inject(CartService);

  restaurantId = signal<number>(0);
  restaurantName = signal<string>('');
  dishes = signal<any[]>([]);
  promotions = signal<any[]>([]);
  loading = signal(true);
  cartOpen = signal(false);

  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.restaurantId.set(Number(id));
      this.loadRestaurant();
      this.loadMenu();
      this.loadPromotions();
    }
  }

  loadRestaurant() {
    this.http.get<any>(`${this.apiUrl}/restaurants/${this.restaurantId()}`).subscribe({
      next: (r) => this.restaurantName.set(r.name || ''),
      error: () => {},
    });
  }

  loadMenu() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/restaurants/${this.restaurantId()}/menu`).subscribe({
      next: (res) => { this.dishes.set(res.items || res.menuItems || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadPromotions() {
    this.http.get<any>(`${this.apiUrl}/restaurants/${this.restaurantId()}/promotions/active`).subscribe({
      next: (res) => this.promotions.set(res.promotions || []),
      error: () => {},
    });
  }

  addToCart(dish: any) {
    if (this.cart.mixedWarning()) return;
    this.cart.addToCart(dish, this.restaurantId(), this.restaurantName());
    if (this.cart.mixedWarning()) return;
    this.cartOpen.set(true);
  }

  dismissMixedWarning() {
    this.cart.clearCart();
    this.cart.dismissWarning();
  }

  getItemQty(dishId: number): number {
    return this.cart.items().find(i => i.id === dishId)?.quantity || 0;
  }
}