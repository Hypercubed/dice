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
import { MatStep } from '@angular/material/stepper';
import { MatInput } from '@angular/material/input';

import { QRCodeComponent } from 'angularx-qrcode';

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
  combineLatestWith,
  share,
  withLatestFrom,
  shareReplay,
  filter,
  delay,
  zip,
  zipWith,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { PasswordStrengthMeterService } from 'angular-password-strength-meter';

import { CryptoService } from '../crypto.service';
import { ConstantsService } from '../constants.service';

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
  maxLength = 300; // maximum allow characters to encode (too many characters will cause the QR code to be too dense)

  passwordHint$ = of('Enter an pass phase');
  passPhaseSuggestions$ = of('');
  passPhaseComplete$ = of(false);
  encoded$ = of('');
  encryptedText$ = of('');
  qrContent$ = of('');
  encodingErrorMessage = '';

  @ViewChild('step2') private step2!: MatStep;
  @ViewChild('messageInput', { static: false, read: MatInput })
  private messageInput!: MatInput;

  @ViewChild(QRCodeComponent, { static: false })
  private qrCode!: QRCodeComponent;

  private destroy$ = new Subject<boolean>();

  get svg() {
    const img: HTMLImageElement =
      this.qrCode.qrcElement.nativeElement.getElementsByTagName('img')[0];
    return img.getAttribute('src');
  }

  constructor(
    public sanitizer: DomSanitizer,
    public crypto: CryptoService,
    private snackBar: MatSnackBar,
    private readonly location: Location,
    private readonly constantsService: ConstantsService,
    private readonly passwordStrengthMeterService: PasswordStrengthMeterService
  ) {}

  ngOnInit() {
    // Get the score of the password
    const scoreWithFeedback$ = this.password.valueChanges.pipe(
      takeUntil(this.destroy$),
      startWith(''),
      map((password) => password?.trim()),
      distinctUntilChanged(),
      tap(() => {
        // Clears existing confirmation
        if (this.confirmPassword.value) {
          this.confirmPassword.setValue('');
        }
      }),
      takeUntil(this.destroy$),
      debounceTime(200),
      map((password) =>
        password
          ? this.passwordStrengthMeterService.scoreWithFeedback(password)
          : { score: -1, feedback: { suggestions: [], warning: '' } }
      ),
      share()
    );

    // Get the password strength and warnings text
    this.passwordHint$ = scoreWithFeedback$.pipe(
      takeUntil(this.destroy$),
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

    // Get the suggestions for the password
    this.passPhaseSuggestions$ = scoreWithFeedback$.pipe(
      takeUntil(this.destroy$),
      map(({ score, feedback }) =>
        score < 0 ? '' : cleanJoin(feedback?.suggestions)
      )
    );

    // True when the password is matches confirm password
    this.passPhaseComplete$ = this.confirmPassword.valueChanges.pipe(
      takeUntil(this.destroy$),
      startWith(''),
      distinctUntilChanged(),
      combineLatestWith(this.password.valueChanges),
      map(
        ([password, confirmPassword]) =>
          !!confirmPassword && confirmPassword === password
      ),
      debounceTime(200),
      shareReplay(1)
    );

    // Focus on input when password is complete
    this.passPhaseComplete$
      .pipe(
        takeUntil(this.destroy$),
        filter(Boolean),
        delay(100),
        tap(() => this.step2.select()),
        delay(100),
        tap(() => {
          if (this.messageInput) this.messageInput.focus();
        })
      )
      .subscribe();

    this.encoded$ = this.message.valueChanges.pipe(
      takeUntil(this.destroy$),
      startWith(''),
      debounceTime(200),
      distinctUntilChanged(),
      combineLatestWith(this.passPhaseComplete$, this.password.valueChanges),
      map(([message, passPhaseComplete, password]) => {
        if (passPhaseComplete) {
          try {
            return this.crypto.encode(message, password);
          } catch (err: any) {
            this.encodingErrorMessage = err.message;
          }
        }
        return '';
      }),
      shareReplay(1)
    );

    this.encryptedText$ = this.encoded$.pipe(map(formatString));

    const includeUrl$ = this.includeUrl.valueChanges.pipe(
      startWith(this.includeUrl.value)
    );

    this.qrContent$ = this.encoded$.pipe(
      takeUntil(this.destroy$),
      combineLatestWith(includeUrl$),
      map(([encrypted, includeUrl]) => {
        if (!encrypted) return '';

        return includeUrl
          ? Location.joinWithSlash(
              this.constantsService.baseURI,
              this.location.prepareExternalUrl('decode/' + encode(encrypted))
            )
          : encrypted;
      }),
      shareReplay(1)
    );

    // Make it hot
    this.qrContent$.subscribe();
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
