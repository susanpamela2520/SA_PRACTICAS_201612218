// src/dashboard/dashboard.component.ts — REEMPLAZAR
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RestaurantService } from '../restaurant/restaurant.service';
import { Restaurant } from '../restaurant/intefaces/restaurant.interface';
import { SharedModule } from '../shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { RestaurantFormComponent } from '../restaurant/restaurant-form/restaurant-form.component';
import { NavbarComponent } from '../core/navbar/navbar.component';
import { AuthService } from '../auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule,
    SharedModule, NavbarComponent, RouterLink, MatTooltipModule,
    FormsModule, MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private dialog = inject(MatDialog);
  private restaurantService = inject(RestaurantService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private router = inject(Router);

  restaurants = signal<Restaurant[]>([]);
  deliveryOrderId: number | null = null;

  ngOnInit(): void {
    if (this.role !== 'Repartidor') {
      this.loadRestaurants();
    }
  }

  loadRestaurants() {
    this.restaurantService.getRestaurants().subscribe({
      next: (res) => this.restaurants.set(res.restaurants || []),
      error: () => this.showMsg('Error al cargar restaurantes'),
    });
  }

  deleteRestaurant(id: number) {
    if (confirm('¿Estás seguro de eliminar este restaurante?')) {
      this.restaurantService.deleteRestaurant(id).subscribe({
        next: () => { this.showMsg('Restaurante eliminado'); this.loadRestaurants(); },
        error: () => this.showMsg('No tienes permisos para esta acción'),
      });
    }
  }

  private showMsg(msg: string) {
    this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(RestaurantFormComponent, { width: '400px', data: null });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.restaurantService.createRestaurant(result).subscribe({
          next: () => { this.showMsg('Restaurante creado con éxito'); this.loadRestaurants(); },
          error: () => this.showMsg('Error al crear. Verifica tus permisos.'),
        });
      }
    });
  }

  editRestaurant(restaurant: Restaurant) {
    const dialogRef = this.dialog.open(RestaurantFormComponent, { width: '400px', data: restaurant });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && restaurant.id) {
        this.restaurantService.updateRestaurant(restaurant.id, result).subscribe({
          next: () => { this.showMsg('Restaurante actualizado'); this.loadRestaurants(); },
          error: () => this.showMsg('Error al actualizar'),
        });
      }
    });
  }

  get role() {
    return this.authService.userRole();
  }
}