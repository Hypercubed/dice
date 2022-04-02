import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import QRCode from 'qrcode-svg';

@Injectable({
  providedIn: 'root',
})
export class QrcodeService {
  constructor(private readonly sanitizer: DomSanitizer) {}

  svg(content: string): string {
    // fix for Code Length OverFlow Error
    if (content.length < 218 && content.length > 191) {
      content += '='.repeat(218 - content.length);
    }

    try {
      return new QRCode({ content, ecl: 'H', join: true }).svg();
    } catch (err) {
      // Try a higher error correction level
      return new QRCode({ content, ecl: 'Q', join: true }).svg();
    }
  }

  base64(content: string) {
    const svg = this.svg(content);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  trusted(content: string) {
    return this.sanitizer.bypassSecurityTrustUrl(this.base64(content));
  }
}
