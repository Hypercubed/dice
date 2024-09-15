import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn } from '@angular/forms';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStep, MatStepperModule } from '@angular/material/stepper';
import { MatInput, MatInputModule } from '@angular/material/input';

import { QRCodeComponent, QRCodeModule } from 'angularx-qrcode';

// @ts-ignore
import { saveUri, createCanvas } from 'svgsaver/src/saveuri.js';

import { debounceTime, distinctUntilChanged, takeUntil, tap, startWith, filter, delay } from 'rxjs/operators';

import { EncodeState, EncodeStore } from './encode.store';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PasswordStrengthMeterComponent } from 'angular-password-strength-meter';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';

const { ClipboardItem } = window as any;
const { clipboard } = window.navigator as any;

function confirmValidator(password: AbstractControl): ValidatorFn {
  const validator = (control: AbstractControl): any | undefined => {
    if (control.value !== password.value) {
      return {
        notConfirmed: {
          password: password,
          passwordConfirmation: control.value,
        },
      };
    }
    return undefined;
  };
  return validator;
}

@Component({
  standalone: true,
  selector: 'app-encode',
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    ClipboardModule,
    MatStepperModule,
    MatFormFieldModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatBadgeModule,

    QRCodeModule,
    PasswordStrengthMeterComponent,
  ],
  providers: [EncodeStore],
})
export class EncodeComponent implements OnInit {
  vm$ = this.store.vm$;

  readonly password = new FormControl('');
  readonly confirmPassPhase = new FormControl('', {
    validators: [confirmValidator(this.password)],
    updateOn: 'change',
  });
  readonly message = new FormControl('');
  readonly includeUrl = new FormControl(true);

  readonly form = new FormGroup({
    password: this.password,
    confirmPassPhase: this.confirmPassPhase,
    message: this.message,
    includeUrl: this.includeUrl,
  });

  readonly maxLength = 300; // maximum allow characters to encode (too many characters will cause the QR code to be too dense)

  @ViewChild('step2') private step2!: MatStep;
  @ViewChild('messageInput', { static: false, read: MatInput })
  private readonly messageInput!: MatInput;

  @ViewChild(QRCodeComponent, { static: false })
  private readonly qrCode!: QRCodeComponent;

  get svg() {
    const img: HTMLImageElement = this.qrCode.qrcElement.nativeElement.getElementsByTagName('img')[0];
    return img.getAttribute('src');
  }

  constructor(private readonly store: EncodeStore, private readonly snackBar: MatSnackBar) {}

  ngOnInit() {
    // Clear confirm password field when password field changes
    // And update hints
    this.password.valueChanges
      .pipe(
        takeUntil(this.store.destroy$),
        startWith(this.password.value),
        distinctUntilChanged(),
        tap(() => {
          // Clears existing confirmation
          if (this.confirmPassPhase.value) {
            this.confirmPassPhase.setValue('');
          }
        })
      )
      .subscribe((passPhase) => {
        this.store.setPassPhase(passPhase || '');
      });

    // Focus on input when password is complete
    this.store.passPhaseVerified$
      .pipe(
        takeUntil(this.store.destroy$),
        filter(Boolean),
        delay(100),
        tap(() => this.step2.select()),
        delay(100)
      )
      .subscribe(() => {
        if (this.messageInput) this.messageInput.focus();
      });

    this.form.valueChanges
      .pipe(
        takeUntil(this.store.destroy$),
        debounceTime(200),
        tap((values) => {
          this.store.patchState(values as EncodeState);
        })
      )
      .subscribe(() => {
        this.store.encode();
      });
  }

  downloadImage() {
    return saveUri(this.svg);
  }

  copyImage() {
    createCanvas(this.svg, 'name', (canvas: { toBlob: (arg0: (blob: any) => void) => void }) => {
      canvas.toBlob((blob: Blob) => this.clip(blob));
    });
  }

  clip(blob: Blob) {
    try {
      clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      this.snackBar.open('Image Copied', '', { duration: 1000 });
    } catch (err: any) {
      console.error(err.name, err.message);
    }
  }
}
