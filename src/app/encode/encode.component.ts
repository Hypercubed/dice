import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';

import { MatSnackBar } from '@angular/material/snack-bar';

// @ts-ignore
import { saveUri, createCanvas } from 'svgsaver/src/saveuri.js';
import { encode } from 'url-safe-base64';

import { CryptoService } from '../crypto.service';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { QrcodeService } from '../qrcode.service';
import { ConstantsService } from '../constants.service';
import { PasswordStrengthMeterService } from 'angular-password-strength-meter';
import { Subject } from 'rxjs';

const { ClipboardItem } = window as any;
const { clipboard } = window.navigator as any;

const scoreText = ['very weak', 'weak', 'better', 'medium', 'strong'];

function isUndefinedOrEmpty(control: AbstractControl): any | undefined {
  if (!control || !control.value || control.value.length === 0) {
    return undefined;
  }
}

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

function formatString(encrypted: string) {
  let display = '';
  for (let i = 0; i < encrypted.length; i += 4) {
    display += encrypted.substring(i, i + 4) + ' ';
  }
  return display;
}

@Component({
  selector: 'app-encode',
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.scss'],
  providers: [PasswordStrengthMeterService],
  encapsulation: ViewEncapsulation.None,
})
export class EncodeComponent implements OnInit, OnDestroy {
  hide = true;

  password = new FormControl('');
  confirmPassword = new FormControl('', {
    validators: [confirm(this.password)],
    updateOn: 'change',
  });
  message = new FormControl('');
  includeUrl = new FormControl(true);

  form = new FormGroup({
    password: this.password,
    confirmPassword: this.confirmPassword,
    message: this.message,
    includeUrl: this.includeUrl,
  });

  phraseHash = '';
  encrypted: any;
  checked = false;

  phraseHashSvg!: SafeResourceUrl;
  svg = '';
  blob: any;
  encryptedSvg!: SafeResourceUrl;
  passwordStrength = '';
  feedback?: { suggestions: string[]; warning: string };
  encryptedText: string = '';
  error: string = '';

  get passwordComplete() {
    return (
      !!this.confirmPassword.value &&
      this.confirmPassword.value === this.password.value
    );
  }

  private destroy$ = new Subject<boolean>();

  constructor(
    public sanitizer: DomSanitizer,
    public crypto: CryptoService,
    private snackBar: MatSnackBar,
    private readonly qrcodeService: QrcodeService,
    private readonly location: Location,
    private readonly constantsService: ConstantsService,
    private readonly passwordStrengthMeterService: PasswordStrengthMeterService
  ) {}

  ngOnInit() {
    this.password.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe((password) => {
        this.confirmPassword.setValue('');
        const { score, feedback } = this.passwordStrengthMeterService.scoreWithFeedback(password);
        this.passwordStrength = scoreText[score];
        this.feedback = feedback;
        if (!this.feedback?.warning?.endsWith('.')) this.feedback.warning += '.';
        if (this.feedback?.suggestions?.length) {
          this.feedback?.suggestions.forEach((suggestion) => {
            if (!suggestion.endsWith('.')) suggestion += '.';
          });
        }
      });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe((x) => {
        try {
          this.encode(x.message, x.password, x.includeUrl);
        } catch (err: any) {
          this.error = err.message;
          this.encryptedText = this.encrypted = this.encryptedSvg = this.svg = '';
        }
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

  private encode(message: string, password: string, includeUrl: boolean) {
    if (message && password) {
      this.encrypted = this.crypto.encode(message, password);
      this.encryptedText = formatString(this.encrypted);
      const content = includeUrl
        ? Location.joinWithSlash(
            this.constantsService.baseURI,
            this.location.prepareExternalUrl(
              'decode/' + encode(this.encrypted)
            )
          )
        : this.encrypted;
      this.svg = this.qrcodeService.base64(content);
      this.encryptedSvg = this.sanitizer.bypassSecurityTrustUrl(this.svg);
      this.error = '';
    } else {
      this.encryptedText = this.encrypted = this.encryptedSvg = this.svg = '';
    }
  }
}
