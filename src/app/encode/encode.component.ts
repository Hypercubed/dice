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
import { Location } from '@angular/common';

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

import { ConstantsService } from '../constants.service';
import { EncodeStore } from './encode.store';

const { ClipboardItem } = window as any;
const { clipboard } = window.navigator as any;

function confirm(password: AbstractControl): ValidatorFn {
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
export class EncodeComponent implements OnInit, OnDestroy {
  vm$ = this.store.vm$;

  readonly password = new FormControl('');
  readonly confirmPassword = new FormControl('', {
    validators: [confirm(this.password)],
    updateOn: 'change',
  });
  readonly message = new FormControl('');
  readonly includeUrl = new FormControl(true);

  readonly form = new FormGroup({
    password: this.password,
    confirmPassword: this.confirmPassword,
    message: this.message,
    includeUrl: this.includeUrl,
  });

  readonly maxLength = 300; // maximum allow characters to encode (too many characters will cause the QR code to be too dense)

  @ViewChild('step2') private step2!: MatStep;
  @ViewChild('messageInput', { static: false, read: MatInput })
  private readonly messageInput!: MatInput;

  @ViewChild(QRCodeComponent, { static: false })
  private readonly qrCode!: QRCodeComponent;

  private readonly destroy$ = new Subject<boolean>();

  get svg() {
    const img: HTMLImageElement =
      this.qrCode.qrcElement.nativeElement.getElementsByTagName('img')[0];
    return img.getAttribute('src');
  }

  constructor(
    private readonly store: EncodeStore,
    private readonly snackBar: MatSnackBar,
    private readonly location: Location,
    private readonly constantsService: ConstantsService
  ) {}

  ngOnInit() {
    this.password.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        startWith(this.password.value),
        debounceTime(200),
        distinctUntilChanged(),
        tap(() => {
          // Clears existing confirmation
          if (this.confirmPassword.value) {
            this.confirmPassword.setValue('');
          }
        })
      )
      .subscribe((password: string) => {
        this.store.setPassPhase(password);
      });

    this.confirmPassword.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        startWith(this.confirmPassword.value),
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe((confirmPassPhase) => {
        this.store.setConfirmPassPhase(confirmPassPhase);
      });

    // Focus on input when password is complete
    this.store.passPhaseVerified$
      .pipe(
        takeUntil(this.destroy$),
        filter(Boolean),
        delay(100),
        tap(() => this.step2.select()),
        delay(100)
      )
      .subscribe(() => {
        if (this.messageInput) this.messageInput.focus();
      });

    this.message.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        startWith(this.message.value),
        debounceTime(200),
        distinctUntilChanged()
      )
      .subscribe((message) => {
        this.store.setMessage(message);
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
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
