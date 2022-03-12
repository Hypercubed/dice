import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import QRCode from 'qrcode-svg';

@Injectable({
  providedIn: 'root'
})
export class QrcodeService {

  constructor(private readonly sanitizer: DomSanitizer) { }

  svg(content: string, message: string = content) {
    const qr = new QRCode({ content, ecl: 'H', join: true, container: 'g' });

    const { width, height } = qr.options;
    const padding = 100;
    const textHeight = 16 * 4;

    const xsize = width! + padding;
    const ysize = height! + padding;

    return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${xsize}" height="${ysize}">
        <style>
          div {
            font: 16px;
            font-family: monospace;
            height: 100%;
            width: 100%;
            overflow: hidden;
            overflow-wrap: break-word;
            text-align: center;
          }
        </style>
        <g transform="translate(${padding / 2})">
          ${qr.svg()}
        </g>
        <foreignObject x="0" y="${height}" width="${xsize}" height="${textHeight}">
          <div xmlns="http://www.w3.org/1999/xhtml">${message}</div>
        </foreignObject>
      </svg>`;
  }

  base64(content: string, message: string = content) {
    const svg = this.svg(content, message);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  trusted(content: string, message: string = content) {
    return this.sanitizer.bypassSecurityTrustUrl(this.base64(content, message));
  }
}
