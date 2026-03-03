// src/app/app.routes.ts — REEMPLAZAR
import { Routes } from '@angular/router';
import { AuthComponent } from '../auth/auth/auth.component';
import { MenuComponent } from '../restaurant/menu/menu.component';
import { OrderViewComponent } from '../restaurant/order-view/order-view.component';
import { SharedModule } from '../shared/shared.module';

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
  { path: '**', redirectTo: 'login' },
];