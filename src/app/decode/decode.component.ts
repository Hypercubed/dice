import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Html5QrcodeScanner } from 'html5-qrcode/esm/html5-qrcode-scanner';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  takeUntil,
} from 'rxjs/operators';
import {
  decode as decodeSafeBase64,
  isBase64,
  isUrlSafeBase64,
} from 'url-safe-base64';
import { ConstantsService } from '../constants.service';

import { CryptoService } from '../crypto.service';
import { of, Subject } from 'rxjs';
import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher,
} from '@angular/material/core';
import { MatStep } from '@angular/material/stepper';
import { MatInput } from '@angular/material/input';

const a = new AudioContext(); // browsers limit the number of concurrent audio contexts, so you better re-use'em

function beep(vol: number, freq: number, duration: number) {
  const v = a.createOscillator();
  const u = a.createGain();
  v.connect(u);
  v.frequency.value = freq;
  v.type = 'square';
  u.connect(a.destination);
  u.gain.value = vol * 0.01;
  v.start(a.currentTime);
  v.stop(a.currentTime + duration * 0.001);
}

@Component({
  templateUrl: './decode.component.html',
  styleUrls: ['./decode.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
  ],
})
export class DecodeComponent implements OnInit, OnDestroy {
  hide = true;

  password = new FormControl('');
  encoded = new FormControl('');

  form = new FormGroup({
    password: this.password,
    encoded: this.encoded,
  });

  decrypted = '';
  decryptionAttempted = false;
  decryptionSuccess = false;
  passwordConfirmed = false;
  scannerInitialized = false;

  @ViewChild('decodedElm') private decodedElm!: ElementRef;
  @ViewChild('passwordElm') private passwordElm!: ElementRef;

  @ViewChild('step2') private step2!: MatStep;
  @ViewChild('encodedInput', { static: false, read: MatInput })
  private encodedInput!: MatInput;

  base64Encoded$ = of('');

  private destroy$ = new Subject<boolean>();

  constructor(
    private readonly crypto: CryptoService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly constantsService: ConstantsService
  ) {}

  ngOnInit() {
    this.base64Encoded$ = this.encoded.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(200),
      map((encoded) => {
        this.decryptionAttempted = false;

        if (encoded.includes('http')) {
          const segments = encoded.split('/');
          encoded = segments[segments.length - 1];
        }
        encoded = decodeSafeBase64(encoded).replace(/\s/g, '');

        const invalid = !isBase64(encoded);
        const invalidFormat = !encoded.startsWith('U2FsdGVkX1');
        const hasError = invalid || invalidFormat;

        this.encoded.setErrors(
          hasError
            ? {
                invalid,
                invalidFormat,
              }
            : null
        );
        return hasError ? '' : encoded;
      })
    );

    this.password.valueChanges.subscribe(() => {
      this.passwordConfirmed = false;
      this.decryptionSuccess = false;
      this.decrypted = '';
    });

    this.base64Encoded$
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((encoded) => {
        this.decryptionAttempted = false;

        if (encoded && this.passwordConfirmed) {
          this.decode(encoded, this.password.value);
        }
      });

    setTimeout(() => {
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
        const param = params['encoded'];
        if (param && isUrlSafeBase64(param)) {
          const encoded = decodeSafeBase64(params['encoded']);
          this.encoded.setValue(encoded);
          this.location.replaceState('decode');
        }
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onPasswordOk() {
    this.passwordConfirmed = true;
    setTimeout(() => {
      this.step2.select();
      setTimeout(() => {
        if (this.encodedInput) this.encodedInput.focus();
        this.setupReader();
        if (this.encoded.value) {
          this.decode(this.encoded.value, this.password.value);
        }
      }, 100);
    }, 100);
  }

  another() {
    this.encoded.setValue('');
    this.decrypted = '';
  }

  stepChanged() {
    if (!this.scannerInitialized) {
      setTimeout(() => {
        this.setupReader();
      }, 100);
    }
  }

  private setupReader() {
    if (this.scannerInitialized) return;

    this.scannerInitialized = true;
    try {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: 150 },
        false
      );

      html5QrcodeScanner.render((encoded) => {
        if (encoded.includes('http')) {
          const segments = encoded.split('/');
          encoded = decodeSafeBase64(segments[segments.length - 1]);
        }
        if (isBase64(encoded)) {
          if (encoded !== this.encoded.value) {
            this.encoded.setValue(encoded);
            if (
              this.passwordConfirmed &&
              this.decode(this.encoded.value, this.password.value)
            ) {
              this.decodedElm.nativeElement.scrollIntoView();
            } else {
              this.passwordElm.nativeElement.scrollIntoView();
            }
          }
        } else {
          this.fail();
        }
      }, undefined);
    } catch (err) {
      this.scannerInitialized = false;
    }
  }

  private decode(encoded: string, password: string) {
    if (this.passwordConfirmed) {
      this.decryptionAttempted = true;
      this.decrypted =
        encoded && password ? this.crypto.decode(encoded, password) : '';
      if (this.decrypted) {
        this.success();
      } else {
        this.fail();
      }
    } else {
      this.decryptionAttempted = false;
      this.decryptionSuccess = false;
      this.decrypted = '';
    }
    return this.decryptionSuccess;
  }

  private success() {
    this.decryptionSuccess = true;

    this.form.setErrors({
      decryptionFailed: false,
    });

    if (this.constantsService.isMobile) {
      beep(100, 520, 200);
      navigator.vibrate(200);
    }
  }

  private fail() {
    this.decryptionSuccess = false;

    this.form.setErrors({
      decryptionFailed: true,
    });

    if (this.constantsService.isMobile) {
      beep(999, 220, 300);
      navigator.vibrate(1000);
    }
  }
}
