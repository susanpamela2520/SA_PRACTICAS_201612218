
import { computed, Injectable, signal } from '@angular/core';
import { MenuItem } from '../restaurant/intefaces/menu.interface';

export interface CartItem extends MenuItem {
  quantity: number;
  restaurantName: string; // NUEVO: para mostrarlo en el drawer
}

@Injectable({
  providedIn: 'root',
})
export class CartService {

  // ── Signals privados ──────────────────────────────────────
  private cartItems = signal<CartItem[]>([]);

  // NUEVO: rastrea a qué restaurante pertenece el carrito actual
  private _restaurantId = signal<number | null>(null);
  private _restaurantName = signal<string>('');

  // ── Signals públicos ──────────────────────────────────────
  // NUEVO: alerta cuando se intenta mezclar restaurantes
  mixedWarning = signal<boolean>(false);

  // Signals computados — igual que antes
  items = computed(() => this.cartItems());

  count = computed(() =>
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0),
  );

  total = computed(() =>
    this.cartItems().reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    ),
  );

  // NUEVO: expone restaurantId y nombre como computed de solo lectura
  restaurantId = computed(() => this._restaurantId());
  restaurantName = computed(() => this._restaurantName());

  // ── Métodos ───────────────────────────────────────────────

  /**
   * MODIFICADO: ahora recibe restaurantId y restaurantName.
   * Si el carrito ya tiene ítems de otro restaurante,
   * activa mixedWarning y no agrega nada.
   */
  addToCart(
    product: MenuItem,
    restaurantId: number,
    restaurantName: string,
  ) {
    const currentRestaurant = this._restaurantId();

    // Validar que no se mezclen restaurantes
    if (currentRestaurant !== null && currentRestaurant !== restaurantId) {
      this.mixedWarning.set(true);
      return;
    }

    this.mixedWarning.set(false);

    const currentItems = this.cartItems();
    const existingItem = currentItems.find((i) => i.id === product.id);

    if (existingItem) {
      // Ítem ya existe → solo incrementar cantidad
      this.cartItems.set(
        currentItems.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      // Ítem nuevo → agregar con quantity 1
      this.cartItems.set([
        ...currentItems,
        { ...product, quantity: 1, restaurantName },
      ]);
      // Guardar el restaurante del carrito
      this._restaurantId.set(restaurantId);
      this._restaurantName.set(restaurantName);
    }
  }

  /**
   * NUEVO: incrementa la cantidad de un ítem ya en el carrito
   * (usado por el botón + del drawer)
   */
  incrementItem(productId: number) {
    this.cartItems.set(
      this.cartItems().map((i) =>
        i.id === productId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    );
  }

  /**
   * NUEVO: decrementa la cantidad. Si llega a 0, elimina el ítem.
   * Si el carrito queda vacío, resetea el restaurante.
   */
  decrementItem(productId: number) {
    const updated = this.cartItems()
      .map((i) =>
        i.id === productId ? { ...i, quantity: i.quantity - 1 } : i,
      )
      .filter((i) => i.quantity > 0);

    this.cartItems.set(updated);

    if (updated.length === 0) {
      this._restaurantId.set(null);
      this._restaurantName.set('');
    }
  }

  // Igual que antes — elimina un ítem completo
  removeItem(productId: number) {
    const updated = this.cartItems().filter((i) => i.id !== productId);
    this.cartItems.set(updated);

    // NUEVO: resetear restaurante si quedó vacío
    if (updated.length === 0) {
      this._restaurantId.set(null);
      this._restaurantName.set('');
    }
  }

  // MODIFICADO: también resetea el restaurante al vaciar
  clearCart() {
    this.cartItems.set([]);
    this._restaurantId.set(null);
    this._restaurantName.set('');
    this.mixedWarning.set(false);
  }

  // NUEVO: cierra el aviso de mezcla de restaurantes
  dismissWarning() {
    this.mixedWarning.set(false);
  }
}
