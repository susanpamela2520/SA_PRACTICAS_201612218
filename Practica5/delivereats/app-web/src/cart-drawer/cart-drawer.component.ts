// src/order/cart-drawer/cart-drawer.component.ts
import { Component, inject, input, output, signal } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CartService } from "../cart.service";
import { SharedModule } from "../../shared/shared.module";

@Component({
  selector: "app-cart-drawer",
  standalone: true,
  imports: [SharedModule],
  templateUrl: "./cart-drawer.component.html",
  styleUrl: "./cart-drawer.component.scss",
})
export class CartDrawerComponent {
  isOpen = input.required<boolean>();
  closed = output<void>();

  cart = inject(CartService);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal("");

  private apiUrl = "http://localhost:3000";

  confirmOrder() {
    const restaurantId = this.cart.restaurantId();
    const items = this.cart.items();
    if (!restaurantId || items.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token) { this.errorMsg.set("Debes iniciar sesion."); return; }

    this.loading.set(true);
    this.errorMsg.set("");

    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    });

    const payload = {
      restaurantId,
      items: items.map((i) => ({
        menuItemId: i.id,
        quantity: i.quantity,
        price: i.price,
      })),
    };

    const totalAmount = this.cart.total();

    this.http.post<any>(this.apiUrl + "/orders", payload, { headers })
      .subscribe({
        next: (order) => {
          this.loading.set(false);
          this.cart.clearCart();
          this.closed.emit();
          this.router.navigate(["/order-success", order.id], {
            queryParams: { total: totalAmount }
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMsg.set(err?.error?.message || "Error al crear la orden.");
        },
      });
  }
}