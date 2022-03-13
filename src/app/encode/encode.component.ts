import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
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

const { ClipboardItem } = window as any;
const { clipboard } = window.navigator as any;

@Component({
  templateUrl: './encode.component.html',
  styleUrls: ['./encode.component.scss'],
})
export class EncodeComponent implements OnInit {
  hide = true;

  password = new FormControl('');
  confirmPassword = new FormControl('');
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
    private readonly constantsService: ConstantsService
  ) {}

  ngOnInit() {
    this.password.valueChanges.subscribe(() =>
      this.confirmPassword.setValue('')
    );

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
