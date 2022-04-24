import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStep } from '@angular/material/stepper';
import { MatInput } from '@angular/material/input';

import { QRCodeComponent } from 'angularx-qrcode';

// @ts-ignore
import { saveUri, createCanvas } from 'svgsaver/src/saveuri.js';

import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  tap,
  startWith,
  filter,
  delay,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';

import { EncodeStore } from './encode.store';

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
  selector: 'app-encode',
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.scss'],
  encapsulation: ViewEncapsulation.None,
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
    const img: HTMLImageElement =
      this.qrCode.qrcElement.nativeElement.getElementsByTagName('img')[0];
    return img.getAttribute('src');
  }

  constructor(
    private readonly store: EncodeStore,
    private readonly snackBar: MatSnackBar
  ) {}

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
      .subscribe((passPhase: string) => {
        this.store.setPassPhase(passPhase);
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
          this.store.patchState(values);
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
    createCanvas(
      this.svg,
      'name',
      (canvas: { toBlob: (arg0: (blob: any) => void) => void }) => {
        canvas.toBlob((blob: Blob) => this.clip(blob));
      }
    );
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
