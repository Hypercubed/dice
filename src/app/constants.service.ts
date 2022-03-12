import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

import isMobile from 'ismobilejs';

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {
  baseURI: string;
  isMobile: boolean;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.baseURI = this.document.baseURI;
    this.isMobile = isMobile(this.document.defaultView as any).any;
  }
}
