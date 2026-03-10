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

  //Restaurante 
  { path: 'restaurant/:id/manage-menu', component: MenuComponent },

  {
    path: 'restaurant/:restaurantId/orders',
    loadComponent: () =>
      import('../restaurant/order-inbox/order-inbox.component').then(m => m.OrderInboxComponent),
  },

  // Órdenes / cliente 
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

  // Repartidor
  {
    path: 'delivery/:orderId',
    loadComponent: () =>
      import('../order/delivery/delivery-photo.component').then(m => m.DeliveryPhotoComponent),
  },

  //  Admin 
  {
    path: 'admin',
    loadComponent: () =>
      import('../admin/admin-panel.component').then(m => m.AdminPanelComponent),
  },

  { path: '**', redirectTo: 'login' },
];