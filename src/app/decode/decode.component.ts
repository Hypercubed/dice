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
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { decode, isBase64, isUrlSafeBase64 } from 'url-safe-base64';
import { ConstantsService } from '../constants.service';

import { CryptoService } from '../crypto.service';
import { Subject } from 'rxjs';

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
  decryptionSuccess = false;
  passwordComplete = false;

  html5QrcodeScanner!: Html5QrcodeScanner;

  @ViewChild('decodedElm') decodedElm!: ElementRef;
  @ViewChild('readerElm') readerElm!: ElementRef;
  @ViewChild('passwordElm') passwordElm!: ElementRef;

  private destroy$ = new Subject<boolean>();

  constructor(
    private readonly crypto: CryptoService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly constantsService: ConstantsService
  ) {}

  ngOnInit() {
    this.encoded.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe(() => this.decode());

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const param = params['encoded'];
      if (param && isUrlSafeBase64(param)) {
        const encoded = decode(params['encoded']);
        this.encoded.setValue(encoded);
        this.location.replaceState('decode');
      }
    });

    this.html5QrcodeScanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: 150 },
      false
    );
    this.html5QrcodeScanner.render((encoded) => {
      if (encoded.includes('http')) {
        const segments = encoded.split('/');
        encoded = decode(segments[segments.length - 1]);
      }
      if (isBase64(encoded)) {
        if (encoded !== this.encoded.value) {
          this.encoded.setValue(encoded);
          this.decrypted = this.crypto.decode(encoded, this.password.value);
          if (this.decrypted) {
            this.decodedElm.nativeElement.scrollIntoView();
          } else {
            this.passwordElm.nativeElement.scrollIntoView();
            this.fail();
          }
        }
      } else {
        this.fail();
      }
    }, undefined);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  onPasswordChanged() {
    this.passwordComplete = false;
    this.decode();
  }

  onPasswordOk() {
    this.passwordComplete = true;
    this.decode();
  }

  another() {
    this.encoded.setValue('');
    this.decrypted = '';
  }

  decode() {
    if (this.passwordComplete) {
      const x = this.form.value;
      this.decrypted =
        x.encoded && x.password
          ? this.crypto.decode(x.encoded, x.password)
          : '';
      if (this.decrypted) {
        this.success();
      } else {
        this.fail();
      }
    } else {
      this.decryptionSuccess = false;
      this.decrypted = '';
    }
  }

  private success() {
    this.decryptionSuccess = true;
    if (this.constantsService.isMobile) {
      beep(100, 520, 200);
      navigator.vibrate(200);
    }
  }

  private fail() {
    this.decryptionSuccess = false;
    if (this.constantsService.isMobile) {
      beep(999, 220, 300);
      navigator.vibrate(1000);
    }
  }
}
