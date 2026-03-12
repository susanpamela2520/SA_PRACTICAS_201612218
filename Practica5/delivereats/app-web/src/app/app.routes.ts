// app-web/src/app/app.routes.ts — REEMPLAZAR
import { Routes } from '@angular/router';
import { AuthComponent } from '../auth/auth/auth.component';
import { MenuComponent } from '../restaurant/menu/menu.component';
import { OrderViewComponent } from '../restaurant/order-view/order-view.component';

export const routes: Routes = [
  { path: 'login', component: AuthComponent },
  {
    path: 'createAccount',
    loadComponent: () =>
      import('../auth/create-account/create-account.component').then(m => m.CreateAccountComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
  path: 'menu/:id',
  loadComponent: () =>
    import('../restaurant/menu-catalog/menu-catalog.component').then(m => m.MenuCatalogComponent),
  },
  { path: 'restaurant/:id/manage-menu', component: MenuComponent },
  { path: 'order/:id', component: OrderViewComponent },
  {
    path: 'order-success/:id',
    loadComponent: () =>
      import('../order/order-success/order-success.component').then(m => m.OrderSuccessComponent),
  },
  {
    path: 'payment/:orderId',
    loadComponent: () =>
      import('../order/payment/payment.component').then(m => m.PaymentComponent),
  },
  {
    path: 'delivery/:orderId',
    loadComponent: () =>
      import('../order/delivery/delivery-photo.component').then(m => m.DeliveryPhotoComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('../admin/admin-panel.component').then(m => m.AdminPanelComponent),
  },

  // ─── ÓRDENES RESTAURANTE ────────────────────────────────
  {
    path: 'restaurant/:restaurantId/orders',
    loadComponent: () =>
      import('../restaurant/order-inbox/order-inbox.component').then(m => m.OrderInboxComponent),
  },

  // ─── PROMOCIONES (Restaurante/Vendedor) ─────────────────
  {
    path: 'restaurant/:restaurantId/promotions',
    loadComponent: () =>
      import('../restaurant/promotions/promotions.component').then(m => m.PromotionsComponent),
  },

  // ─── CUPONES (Restaurante/Vendedor) ─────────────────────
  {
    path: 'restaurant/:restaurantId/coupons',
    loadComponent: () =>
      import('../restaurant/coupons/coupons.component').then(m => m.CouponsComponent),
  },

  // ─── APROBACIÓN CUPONES (Admin) ──────────────────────────
  {
    path: 'admin/coupons',
    loadComponent: () =>
      import('../admin/admin-coupons.component').then(m => m.AdminCouponsComponent),
  },

  {
    path: 'repartidor',
    loadComponent: () =>
      import('../repartidor-dashboard/repartidor-dashboard.component').then(
        m => m.RepartidorDashboardComponent,
      ),
  },

{
  path: 'rate/:orderId',
  loadComponent: () =>
    import('../order/rating/rating.component').then(m => m.RatingComponent),
},

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];

