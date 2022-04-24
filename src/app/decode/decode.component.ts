import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Html5QrcodeScanner } from 'html5-qrcode/esm/html5-qrcode-scanner';
import {
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  decode as decodeSafeBase64,
  isBase64,
  isUrlSafeBase64,
} from 'url-safe-base64';

import {
  ErrorStateMatcher,
  ShowOnDirtyErrorStateMatcher,
} from '@angular/material/core';
import { MatStep } from '@angular/material/stepper';
import { MatInput } from '@angular/material/input';
import { DecodeStore } from './decode.store';

// move to utils
function cleanup(encoded: string) {
  if (encoded.includes('http')) {
    const segments = encoded.split('/');
    encoded = segments[segments.length - 1];
  }
  return decodeSafeBase64(encoded).replace(/\s/g, '');
}

@Component({
  templateUrl: './decode.component.html',
  styleUrls: ['./decode.component.scss'],
  providers: [
    DecodeStore,
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
  ],
})
export class DecodeComponent implements OnInit {
  vm$ = this.store.vm$;

  passPhase = new FormControl('');
  encoded = new FormControl('');

  form = new FormGroup({
    passPhase: this.passPhase,
    encoded: this.encoded,
  });

  @ViewChild('decodedElm') private decodedElm!: ElementRef;
  @ViewChild('passPhaseElm') private passPhaseElm!: ElementRef;

  @ViewChild('step2') private step2!: MatStep;
  @ViewChild('encodedInput', { static: false, read: MatInput })
  private encodedInput!: MatInput;

  private scannerInitialized = false;

  constructor(
    private readonly store: DecodeStore,
    private readonly route: ActivatedRoute,
    private readonly location: Location
  ) {}

  ngOnInit() {
    this.passPhase.valueChanges
      .pipe(
        takeUntil(this.store.destroy$),
        tap((passPhase) => {
          this.store.patchState({
            passPhase,
            decryptionSuccess: false,
            passPhaseConfirmed: false,
            decrypted: '',
          });
        })
      )
      .subscribe(() => {
        this.store.decode();
      });

    this.encoded.valueChanges
      .pipe(
        takeUntil(this.store.destroy$),
        debounceTime(200),
        distinctUntilChanged(),
        tap((encoded) => {
          encoded = cleanup(encoded);

          // TODO: move to validators
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

          this.store.patchState({
            encoded,
          });
        })
      )
      .subscribe(() => {
        this.store.decode();
      });

    setTimeout(() => {
      this.route.params
        .pipe(takeUntil(this.store.destroy$))
        .subscribe((params) => {
          const param = params['encoded'];
          if (param && isUrlSafeBase64(param)) {
            const encoded = cleanup(params['encoded']);
            if (encoded !== this.encoded.value) {
              this.encoded.setValue(encoded);
            }
            this.location.replaceState('decode');
          }
        });
    });
  }

  onTogglePassPhase(showPassPhase: boolean) {
    this.store.patchState({ showPassPhase });
  }

  onPassPhaseOk() {
    this.store.patchState({
      passPhaseConfirmed: true,
    });

    setTimeout(() => {
      this.step2.select();
      setTimeout(() => {
        if (this.encodedInput) this.encodedInput.focus();
        this.setupReader();
        this.store.decode();
      }, 100);
    }, 100);
  }

  stepChanged() {
    setTimeout(() => {
      this.setupReader();
    }, 100);
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
        encoded = cleanup(encoded);
        if (encoded !== this.encoded.value) {
          this.encoded.setValue(encoded);
        }
      }, undefined);
    } catch (err) {
      this.scannerInitialized = false;
    }
  }
}
