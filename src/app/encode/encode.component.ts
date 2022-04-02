import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { QrcodeService } from '../qrcode.service';
import { ConstantsService } from '../constants.service';
import { PasswordStrengthMeterService } from 'angular-password-strength-meter';

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

@Component({
  selector: 'app-encode',
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.scss'],
  providers: [PasswordStrengthMeterService],
  encapsulation: ViewEncapsulation.None,
})
export class EncodeComponent implements OnInit {
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

  get passwordComplete() {
    return (
      !!this.confirmPassword.value &&
      this.confirmPassword.value === this.password.value
    );
  }

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
    this.password.valueChanges.subscribe((password) => {
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
      .pipe(debounceTime(200), distinctUntilChanged())
      .subscribe((x) => {
        if (x.message && x.password) {
          this.encrypted = this.crypto.encode(x.message, x.password);
          const content = x.includeUrl
            ? Location.joinWithSlash(
                this.constantsService.baseURI,
                this.location.prepareExternalUrl(
                  'decode/' + encode(this.encrypted)
                )
              )
            : this.encrypted;
          this.svg = this.qrcodeService.base64(content);
          this.encryptedSvg = this.sanitizer.bypassSecurityTrustUrl(this.svg);
        } else {
          this.encrypted = this.encryptedSvg = this.svg = '';
        }
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
