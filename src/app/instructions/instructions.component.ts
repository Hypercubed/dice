import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { ConstantsService } from '../constants.service';
import { QrcodeService } from '../qrcode.service';

@Component({
  selector: 'app-instructions',
  templateUrl: './instructions.component.html',
  styleUrls: ['./instructions.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-instructions',
  },
})
export class InstructionsComponent implements OnInit {
  url!: string;
  pageSvg!: SafeUrl;

  constructor(
    private readonly service: QrcodeService,
    private readonly constantsService: ConstantsService
  ) {}

  ngOnInit() {
    this.url = this.constantsService.baseURI;
    this.pageSvg = this.service.trusted(this.url);
  }
}
