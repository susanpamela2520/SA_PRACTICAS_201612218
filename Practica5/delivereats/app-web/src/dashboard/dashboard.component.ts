import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
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
import { CommonModule } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatSnackBarModule,
    SharedModule, NavbarComponent, RouterLink, MatTooltipModule,
    FormsModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSelectModule, MatSlideToggleModule, MatChipsModule, MatBadgeModule,
    MatMenuModule, MatToolbarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private dialog = inject(MatDialog);
  private restaurantService = inject(RestaurantService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  public router = inject(Router);

  restaurants: Restaurant[] = [];
  filteredRestaurants: Restaurant[] = [];
  pendingCounts: Record<number, number> = {};
  loading = false;

  searchText = '';
  selectedCategory = '';
  selectedSort = '';
  onlyWithPromotion = false;

  private filterSubject = new Subject<void>();

 get userRole() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return '';
    return JSON.parse(atob(token.split('.')[1])).role || '';
  } catch { return ''; }
}

  ngOnInit(): void {
    if (this.userRole !== 'Repartidor') {
      this.loadRestaurants();
    }
    this.filterSubject.pipe(debounceTime(300)).subscribe(() => this.executeFilter());
  }

  loadRestaurants() {
    this.loading = true;
    this.restaurantService.getRestaurants().subscribe({
      next: (res) => {
        this.restaurants = res.restaurants || [];
        this.filteredRestaurants = [...this.restaurants];
        this.loading = false;
      },
      error: () => { this.showMsg('Error al cargar restaurantes'); this.loading = false; },
    });
  }

  applyFilters() { this.filterSubject.next(); }

  executeFilter() {
    const hasFilters = this.selectedCategory || this.selectedSort || this.onlyWithPromotion || this.searchText;
    if (!hasFilters) { this.filteredRestaurants = [...this.restaurants]; return; }

    this.loading = true;
    this.restaurantService.getFilteredRestaurants({
      category: this.selectedCategory,
      sortBy: this.selectedSort,
      onlyWithPromotion: this.onlyWithPromotion,
      search: this.searchText,
    }).subscribe({
      next: (res) => { this.filteredRestaurants = res.restaurants || []; this.loading = false; },
      error: () => { this.showMsg('Error al filtrar'); this.loading = false; },
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategory || this.selectedSort || this.onlyWithPromotion || this.searchText);
  }

  getSortLabel(): string {
    const labels: Record<string, string> = {
      nuevos: '🆕 Nuevos', destacados: '⭐ Destacados', mejor_puntuados: '🏆 Mejor puntuados',
    };
    return labels[this.selectedSort] || this.selectedSort;
  }

  clearFilter(type: string) {
    if (type === 'category') this.selectedCategory = '';
    if (type === 'sort') this.selectedSort = '';
    if (type === 'promo') this.onlyWithPromotion = false;
    if (type === 'search') this.searchText = '';
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchText = ''; this.selectedCategory = '';
    this.selectedSort = ''; this.onlyWithPromotion = false;
    this.filteredRestaurants = [...this.restaurants];
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToMenu(restaurantId: number) { this.router.navigate(['/menu', restaurantId]); }
  goToOrders(restaurantId: number) { this.router.navigate(['/restaurant', restaurantId, 'orders']); }

  goToCreate() {
    const dialogRef = this.dialog.open(RestaurantFormComponent, { width: '400px', data: null });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.restaurantService.createRestaurant(result).subscribe({
          next: () => { this.showMsg('Restaurante creado'); this.loadRestaurants(); },
          error: () => this.showMsg('Error al crear'),
        });
      }
    });
  }

  deleteRestaurant(id: number) {
    if (confirm('¿Eliminar este restaurante?')) {
      this.restaurantService.deleteRestaurant(id).subscribe({
        next: () => { this.showMsg('Restaurante eliminado'); this.loadRestaurants(); },
        error: () => this.showMsg('Sin permisos'),
      });
    }
  }

  private showMsg(msg: string) {
    this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
  }
}