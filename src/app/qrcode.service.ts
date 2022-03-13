import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import QRCode from 'qrcode-svg';

@Injectable({
  providedIn: 'root',
})
export class QrcodeService {
  constructor(private readonly sanitizer: DomSanitizer) {}

  svg(content: string) {
    return new QRCode({ content, ecl: 'H', join: true }).svg();
  }

  base64(content: string) {
    const svg = this.svg(content);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  trusted(content: string) {
    return this.sanitizer.bypassSecurityTrustUrl(this.base64(content));
  }
}
