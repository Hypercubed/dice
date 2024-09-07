import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Html5QrcodeScanner } from 'html5-qrcode/esm/html5-qrcode-scanner';
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { decode as decodeSafeBase64, isBase64, isUrlSafeBase64 } from 'url-safe-base64';

import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
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
  selector: 'app-decode',
  templateUrl: './decode.component.html',
  styleUrls: ['./decode.component.scss'],
  providers: [DecodeStore, { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }],
  encapsulation: ViewEncapsulation.None,
})
export class DecodeComponent implements OnInit {
  vm$ = this.store.vm$;

  passPhase = new UntypedFormControl('');
  encoded = new UntypedFormControl('');

  form = new UntypedFormGroup({
    passPhase: this.passPhase,
    encoded: this.encoded,
  });

  @ViewChild('decodedElm') private decodedElm!: ElementRef;
  @ViewChild('passPhaseElm') private passPhaseElm!: ElementRef;

  @ViewChild('step2') private step2!: MatStep;
  @ViewChild('encodedInput', { static: false, read: MatInput })
  private encodedInput!: MatInput;

  private html5QrcodeScanner!: Html5QrcodeScanner | undefined;

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
      this.route.params.pipe(takeUntil(this.store.destroy$)).subscribe((params) => {
        const param = params['encoded'];
        if (param && isUrlSafeBase64(param)) {
          this.onRead(params['encoded']);
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
        this.store.decode();
      }, 100);
    }, 100);
  }

  async toggleReader() {
    if (this.html5QrcodeScanner) {
      await this.html5QrcodeScanner.clear();
      this.html5QrcodeScanner = undefined;
      return;
    }

    try {
      this.html5QrcodeScanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 150 }, false);

      this.html5QrcodeScanner.render((encoded) => {
        this.onRead(encoded);
      }, undefined);
    } catch (err) {
      this.html5QrcodeScanner = undefined;
    }
  }

  private onRead(encoded: string) {
    encoded = cleanup(encoded);
    if (encoded !== this.encoded.value) {
      this.encoded.setValue(encoded);
    }
  }
}
