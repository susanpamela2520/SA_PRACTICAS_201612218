import { Component, inject, input, output, signal } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CartService } from "../order/cart.service";
import { SharedModule } from "../shared/shared.module";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-cart-drawer",
  standalone: true,
  imports: [SharedModule, FormsModule],
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

  // Cupón
  couponCode = signal("");
  couponLoading = signal(false);
  couponError = signal("");
  couponApplied = signal(false);
  discountPercent = signal(0);
  discountAmount = signal(0);
  finalTotal = signal(0);
  appliedCouponId = signal<number | null>(null);

  private apiUrl = "http://localhost:3000";

  get originalTotal() { return this.cart.total(); }

  get displayTotal() {
    return this.couponApplied() ? this.finalTotal() : this.originalTotal;
  }

  validateCoupon() {
    const code = this.couponCode().trim();
    if (!code) return;

    this.couponLoading.set(true);
    this.couponError.set("");

    const token = localStorage.getItem("token");
    const headers = new HttpHeaders({ Authorization: "Bearer " + token });

    this.http.post<any>(
      `${this.apiUrl}/restaurants/coupons/validate`,
      { code, restaurantId: this.cart.restaurantId(), orderTotal: this.originalTotal },
      { headers }
    ).subscribe({
      next: (res) => {
        this.couponLoading.set(false);
        if (res.valid) {
          this.couponApplied.set(true);
          this.discountPercent.set(res.discountPercent);
          this.discountAmount.set(res.discountAmount);
          this.finalTotal.set(res.finalTotal);
          this.appliedCouponId.set(res.couponId);
          this.couponError.set("");
        } else {
          this.couponApplied.set(false);
          this.couponError.set(res.message || "Cupón no válido");
        }
      },
      error: () => {
        this.couponLoading.set(false);
        this.couponError.set("Error al validar el cupón");
      },
    });
  }

  removeCoupon() {
    this.couponCode.set("");
    this.couponApplied.set(false);
    this.discountPercent.set(0);
    this.discountAmount.set(0);
    this.finalTotal.set(0);
    this.appliedCouponId.set(null);
    this.couponError.set("");
  }

  confirmOrder() {
    const restaurantId = this.cart.restaurantId();
    const items = this.cart.items();
    if (!restaurantId || items.length === 0) return;

    const token = localStorage.getItem("token");
    if (!token) { this.errorMsg.set("Debes iniciar sesión."); return; }

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
      // Enviar info del cupón si fue aplicado
      couponId: this.appliedCouponId() || undefined,
      discountAmount: this.couponApplied() ? this.discountAmount() : 0,
      finalTotal: this.couponApplied() ? this.finalTotal() : this.originalTotal,
    };

    this.http.post<any>(this.apiUrl + "/orders", payload, { headers })
      .subscribe({
        next: (order) => {
          this.loading.set(false);
          this.cart.clearCart();
          this.closed.emit();
          this.router.navigate(["/order-success", order.id], {
            queryParams: { total: this.displayTotal }
          });
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMsg.set(err?.error?.message || "Error al crear la orden.");
        },
      });
  }
}