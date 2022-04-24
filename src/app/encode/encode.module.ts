import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { RouterModule, Routes } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';

import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';

import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { EncodeComponent } from './encode.component';

const routes: Routes = [
  {
    path: '',
    component: EncodeComponent,
  },
];

@NgModule({
  declarations: [EncodeComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    MatCheckboxModule,
    PasswordStrengthMeterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatStepperModule,
    MatTooltipModule,
    MatBadgeModule,
    QRCodeModule,
  ],
  exports: [RouterModule],
})
export class AppEncodeModule {}
