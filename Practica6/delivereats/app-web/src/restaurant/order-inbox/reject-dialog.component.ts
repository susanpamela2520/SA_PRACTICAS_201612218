// Diálogo pequeño que pide la razón cuando el restaurante rechaza una orden.
// Se usa con MatDialog dentro de order-inbox.component.ts

import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [SharedModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle; margin-right:8px; color:#e53935">cancel</mat-icon>
      Rechazar Orden #{{ data.orderId }}
    </h2>

    <mat-dialog-content>
      <p class="subtitle">Indica el motivo del rechazo para notificar al cliente.</p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Razón del rechazo</mat-label>
        <textarea
          matInput
          [formControl]="reasonCtrl"
          rows="3"
          placeholder="Ej: Ingredientes agotados, restaurante cerrado..."
        ></textarea>
        @if (reasonCtrl.hasError('required')) {
          <mat-error>La razón es requerida</mat-error>
        }
        @if (reasonCtrl.hasError('minlength')) {
          <mat-error>Mínimo 5 caracteres</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button
        mat-flat-button
        color="warn"
        [disabled]="reasonCtrl.invalid"
        (click)="confirm()"
      >
        <mat-icon>block</mat-icon>
        Confirmar rechazo
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-top: 8px; }
    .subtitle   { color: #666; font-size: 14px; margin-bottom: 12px; }
    mat-dialog-content { min-width: 340px; }
  `],
})
export class RejectDialogComponent {
  data    = inject<{ orderId: number }>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<RejectDialogComponent>);
  private fb        = inject(FormBuilder);

  reasonCtrl = this.fb.control('', [Validators.required, Validators.minLength(5)]);

  confirm(): void {
    if (this.reasonCtrl.invalid) return;
    this.dialogRef.close(this.reasonCtrl.value);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}