import { TestBed } from '@angular/core/testing';

import { CryptoService } from './crypto.service';

const testDecoding = [
  // Encoded using Dice
  ['nO62tPMSge', 'Ambrosi', 'U2FsdGVkX18G7u+bUTUSmf7daGUYWzT1wbVJ4V7hMZM='],
  ['2dUEV0CuZ6', 'Bethena', 'U2FsdGVkX19356LNnbjF2FcJ4+6h2BD2HUUWKqXfcvg='],
  [
    'u3g2sk6DC',
    'Nulla nisl. Nunc nisl. Duis bibendum',
    'U2FsdGVkX1/3Mi024kJj66/n3Rk5jTpkLB+7rn5vbcueLmdBN2z0RF2tJpdExvo6XstxuL/P2pCVZRJgPlbTLw==',
  ],
  // OpenSSL 1.1.1f
  ['9WPwJ8gRkJI', 'Marna', 'U2FsdGVkX19r0SsJRSfRdQ84pccyMNOgqEz6DZ3tl2Y='],
  ['QAseekbshO6', 'Jerrie', 'U2FsdGVkX1/XXp5JsPO8I8J1KfqWKHwfPpUywUx4Nx4='],
  [
    'u3g2sk6DC',
    'Nulla nisl. Nunc nisl. Duis bibendum',
    'U2FsdGVkX1/RL2eQscpOk4coH+oCkR50ei/rFYTCqeqTjpAX6G/iavF1Su3l05j0EuBKSCwgaeymu+qFeKYD2Q==',
  ],
  // OpenSSL 1.1.1m
  ['PAAxipHavI', 'Rustidge', 'U2FsdGVkX1+c6iWxTaCX77vrpz3h+JNmK0z89MvxDaM='],
  [
    'Did you see a small dog with a red collar',
    'The coffee shop closes at midnight',
    'U2FsdGVkX1/YB40FRxDAbPh1pD1vm69kaNi3JMT5vv34tbUmSvd5xYE+GdjLfNIg9/xvdIv+RQF9HBIAPim/Yg==',
  ],
  // LibreSSL 3.4.2
  [
    'Virtual grid-enabled moderator',
    'Reduced analyzing knowledge base',
    'U2FsdGVkX19loYHdQu3erlXT/1j4XPee+yFtxKpA+WOSpOa8zqZgu+yxSzC1xxlaAlmzPunXhIG6laelq3EPbQ==',
  ],
];

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CryptoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should decode a string', async () => {
    for (const test of testDecoding) {
      expect(await service.decode(test[2], test[0])).toEqual(test[1]);
    }
  });

  it('should encode/decode a string', async () => {
    for (const test of testDecoding) {
      const encode = await service.encode(test[1], test[0]);
      const decode = await service.decode(encode, test[0]);
      expect(decode).toEqual(test[1]);
    }
  });
});
