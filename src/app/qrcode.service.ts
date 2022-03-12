import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import QRCode from 'qrcode-svg';

@Injectable({
  providedIn: 'root'
})
export class QrcodeService {

  constructor(private readonly sanitizer: DomSanitizer) { }

  svg(content: string, message: string = content) {
    return new QRCode({ content, ecl: 'H', join: true }).svg();
  }

  base64(content: string, message: string = content) {
    const svg = this.svg(content, message);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  trusted(content: string, message: string = content) {
    return this.sanitizer.bypassSecurityTrustUrl(this.base64(content, message));
  }
}
