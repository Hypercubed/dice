import { Component, ElementRef, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { ClipboardModule } from '@angular/cdk/clipboard';

import { Html5QrcodeScanner } from 'html5-qrcode/esm/html5-qrcode-scanner';
import { debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { isBase64, isUrlSafeBase64 } from 'url-safe-base64';

import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MatStep, MatStepperModule } from '@angular/material/stepper';
import { MatInput, MatInputModule } from '@angular/material/input';
import { DecodeStore } from './decode.store';
import { cleanupEncodedText } from '../salted';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  standalone: true,
  selector: 'app-decode',
  templateUrl: './decode.component.html',
  styleUrls: ['./decode.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    ClipboardModule,
    MatStepperModule,
    MatFormFieldModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatBadgeModule,
  ],
  providers: [DecodeStore, { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }],
  encapsulation: ViewEncapsulation.None,
})
export class DecodeComponent implements OnInit {
  private readonly store = inject(DecodeStore);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  vm$ = this.store.vm$;

  passPhase = new FormControl<string>('');
  encoded = new FormControl<string>('');

  form = new FormGroup({
    passPhase: this.passPhase,
    encoded: this.encoded,
  });

  @ViewChild('decodedElm') private decodedElm!: ElementRef;
  @ViewChild('passPhaseElm') private passPhaseElm!: ElementRef;

  @ViewChild('step2') private step2!: MatStep;
  @ViewChild('encodedInput', { static: false, read: MatInput })
  private encodedInput!: MatInput;

  private html5QrcodeScanner!: Html5QrcodeScanner | undefined;

  ngOnInit() {
    this.passPhase.valueChanges
      .pipe(
        takeUntil(this.store.destroy$),
        tap((passPhase) => {
          this.store.patchState({
            passPhase: passPhase || '',
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
          encoded = cleanupEncodedText(encoded || '');

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
    encoded = cleanupEncodedText(encoded);
    if (encoded !== this.encoded.value) {
      this.encoded.setValue(encoded);
    }
  }
}
