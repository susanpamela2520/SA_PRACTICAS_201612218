// src/order/delivery/delivery-photo.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SharedModule } from '../../shared/shared.module';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-delivery-photo',
  standalone: true,
  imports: [SharedModule, FormsModule ],
  template: `
    <div class="delivery-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>📸 Confirmar entrega #{{ orderId() }}</mat-card-title>
          <mat-card-subtitle>Sube una fotografía como evidencia de entrega</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (photoPreview()) {
            <div class="preview-container">
              <img [src]="photoPreview()" alt="Evidencia de entrega" class="photo-preview">
              <button mat-icon-button color="warn" (click)="removePhoto()" class="remove-btn">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          }

          @if (!photoPreview()) {
            <div class="upload-area" (click)="fileInput.click()">
              <mat-icon class="upload-icon">add_a_photo</mat-icon>
              <p>Toca para tomar o seleccionar foto</p>
              <small>JPG, PNG — máx. 5MB</small>
            </div>
          }

          <input #fileInput type="file" accept="image/*" capture="environment"
                 style="display:none" (change)="onFileSelected($event)">

          @if (failedMode()) {
            <mat-form-field appearance="outline" class="reason-field">
              <mat-label>Razón del fallo</mat-label>
              <input matInput [(ngModel)]="failedReason" placeholder="Ej: Cliente no estaba en casa">
              <mat-icon matPrefix>report_problem</mat-icon>
            </mat-form-field>
          }

          @if (error()) {
            <div class="error-msg">
              <mat-icon>error_outline</mat-icon> {{ error() }}
            </div>
          }

          @if (success()) {
            <div class="success-msg">
              <mat-icon>check_circle</mat-icon>
              {{ failedMode() ? "Entrega marcada como fallida." : "¡Entrega confirmada con foto!" }}
            </div>
          }
        </mat-card-content>

        <mat-card-actions class="actions">
          @if (!success()) {
            <button mat-raised-button color="primary" class="confirm-btn"
              [disabled]="!photoPreview() || loading()"
              (click)="confirmDelivery()">
              @if (loading() && !failedMode()) {
                <ng-container><mat-spinner diameter="20"></mat-spinner> Subiendo...</ng-container>
              } @else {
                <ng-container><mat-icon>check</mat-icon> Confirmar entrega</ng-container>
              }
            </button>

            <button mat-stroked-button color="warn" class="failed-btn"
              [disabled]="loading()"
              (click)="toggleFailedMode()">
              <mat-icon>cancel</mat-icon>
              {{ failedMode() ? "Cancelar" : "No pude entregar" }}
            </button>

            @if (failedMode()) {
              <button mat-raised-button color="warn" class="confirm-btn"
                [disabled]="loading()"
                (click)="markAsFailed()">
                @if (loading()) {
                  <ng-container><mat-spinner diameter="20"></mat-spinner> Procesando...</ng-container>
                } @else {
                  <ng-container><mat-icon>report</mat-icon> Confirmar fallo</ng-container>
                }
              </button>
            }
          } @else {
            <button mat-raised-button color="accent" (click)="goBack()">
              Volver a mis entregas
            </button>
          }
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .delivery-container { max-width: 480px; margin: 40px auto; padding: 0 16px; }
    mat-card { border-radius: 16px !important; }
    .upload-area {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; border: 2px dashed #1976d2; border-radius: 12px;
      padding: 40px; cursor: pointer; transition: background 0.2s;
    }
    .upload-area:hover { background: #e3f2fd; }
    .upload-icon { font-size: 3rem; width: 3rem; height: 3rem; color: #1976d2; }
    .preview-container { position: relative; }
    .photo-preview { width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px; display: block; }
    .remove-btn { position: absolute; top: 8px; right: 8px; background: white; }
    .error-msg { display: flex; align-items: center; gap: 6px; background: #ffebee; color: #c62828; padding: 10px 14px; border-radius: 8px; margin-top: 12px; }
    .success-msg { display: flex; align-items: center; gap: 6px; background: #e8f5e9; color: #2e7d32; padding: 10px 14px; border-radius: 8px; margin-top: 12px; font-weight: 500; }
    .actions { display: flex; flex-direction: column; gap: 8px; padding: 8px 16px 16px; }
    .confirm-btn { width: 100%; height: 46px; }
    .failed-btn { width: 100%; height: 46px; }
    .reason-field { width: 100%; margin-top: 12px; }
  `],
})
export class DeliveryPhotoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  orderId = signal<number>(0);
  photoPreview = signal<string | null>(null);
  photoBase64 = signal<string>('');
  loading = signal(false);
  error = signal('');
  success = signal(false);
  failedMode = signal(false);
  failedReason = '';

  private apiUrl = 'http://localhost:3000';

  ngOnInit() {
    this.orderId.set(Number(this.route.snapshot.paramMap.get('orderId')));
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.error.set('La imagen no debe superar 5MB.'); return; }
    this.error.set('');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.photoPreview.set(base64);
      this.photoBase64.set(base64);
    };
    reader.readAsDataURL(file);
  }

  removePhoto() { this.photoPreview.set(null); this.photoBase64.set(''); }

  toggleFailedMode() {
    this.failedMode.set(!this.failedMode());
    this.error.set('');
  }

  confirmDelivery() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
    this.loading.set(true);
    this.http.post<any>(`${this.apiUrl}/orders/${this.orderId()}/delivery-photo`,
      { photoBase64: this.photoBase64() }, { headers })
      .subscribe({
        next: () => { this.loading.set(false); this.success.set(true); },
        error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Error al subir la foto.'); },
      });
  }

  markAsFailed() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    });
    this.loading.set(true);
    this.http.patch<any>(`${this.apiUrl}/orders/${this.orderId()}/status`,
      { status: 'FAILED', deliveryFailedReason: this.failedReason || 'No se pudo entregar' },
      { headers })
      .subscribe({
        next: () => { this.loading.set(false); this.success.set(true); },
        error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Error al marcar el fallo.'); },
      });
  }

  goBack() { this.router.navigate(['/dashboard']); }
}