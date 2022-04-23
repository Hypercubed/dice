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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';

import { MatSnackBar } from '@angular/material/snack-bar';

// @ts-ignore
import { saveUri, createCanvas } from 'svgsaver/src/saveuri.js';
import { encode } from 'url-safe-base64';

import {
  debounceTime,
  distinctUntilChanged,
  map,
  takeUntil,
  tap,
  startWith,
  combineLatest,
  combineLatestWith,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { PasswordStrengthMeterService } from 'angular-password-strength-meter';

import { CryptoService } from '../crypto.service';
import { QrcodeService } from '../qrcode.service';
import { ConstantsService } from '../constants.service';
import { MatStep } from '@angular/material/stepper';

const { ClipboardItem } = window as any;
const { clipboard } = window.navigator as any;

const scoreText = ['very weak', 'weak', 'better', 'medium', 'strong'];

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

function cleanJoin(strings: string[]) {
  strings = strings
    .map((s) => {
      s = s?.trim();
      if (s) {
        if (s?.endsWith('.')) {
          return s.replace(/.$/, '');
        }
      }
      return s;
    })
    .filter(Boolean);

  if (strings.length > 1) {
    strings.push('');
  }

  return strings.join('. ');
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
  passwordHint$ = of('Enter an pass phase');
  passPhaseSuggestions$ = of('');
  passPhaseComplete$ = of(false);
  encryptedText: string = '';
  encodingErrorMessage: string = '';

  @ViewChild('step2') private step2!: MatStep;

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
    const scoreWithFeedback$ = this.password.valueChanges.pipe(
      startWith(''),
      takeUntil(this.destroy$),
      debounceTime(200),
      distinctUntilChanged(),
      tap(() => {
        this.confirmPassword.setValue('');
      }),
      map((password) => {
        if (!password || !password.trim()) {
          return { score: -1, feedback: { suggestions: [], warning: '' } };
        }
        return this.passwordStrengthMeterService.scoreWithFeedback(password);
      })
    );

    this.passwordHint$ = scoreWithFeedback$.pipe(
      map(({ score, feedback }) => {
        if (score < 0) {
          return 'Enter an pass phase';
        }

        const hints = [
          `Pass phase is ${scoreText[score]}`,
          feedback?.warning,
        ].filter(Boolean);
        return cleanJoin(hints);
      })
    );

    this.passPhaseSuggestions$ = scoreWithFeedback$.pipe(
      map(({ score, feedback }) => {
        if (score < 0) {
          return '';
        }
        return cleanJoin(feedback?.suggestions);
      })
    );

    this.passPhaseComplete$ = this.password.valueChanges.pipe(
      combineLatestWith(this.confirmPassword.valueChanges),
      map(
        ([password, confirmPassword]) =>
          !!confirmPassword && confirmPassword === password
      ),
      tap((passPhaseComplete) => {
        if (passPhaseComplete) {
          setTimeout(() => {
            this.step2.select();
          });
        }
      })
    );

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200), distinctUntilChanged())
      .subscribe((x) => {
        try {
          this.encode(x.message, x.password, x.includeUrl);
        } catch (err: any) {
          this.encodingErrorMessage = err.message;
          this.encryptedText =
            this.encrypted =
            this.encryptedSvg =
            this.svg =
              '';
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
    this.encodingErrorMessage = '';
    this.encryptedText = this.encrypted = this.encryptedSvg = this.svg = '';

    if (message && password) {
      this.encrypted = this.crypto.encode(message, password);
      this.encryptedText = formatString(this.encrypted);
      const content = includeUrl
        ? Location.joinWithSlash(
            this.constantsService.baseURI,
            this.location.prepareExternalUrl('decode/' + encode(this.encrypted))
          )
        : this.encrypted;
      this.svg = this.qrcodeService.base64(content);
      this.encryptedSvg = this.sanitizer.bypassSecurityTrustUrl(this.svg);
    }
  }
}
