import { TestBed } from '@angular/core/testing';

import { CryptoService } from './crypto.service';
import { encrypt, decrypt } from './salted';
import { DecodingTests } from 'fixtures/decoding-tests';

describe('Salted', () => {
  let service: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CryptoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should decode a string', async () => {
    for (const test of DecodingTests) {
      expect(await decrypt(test[2], test[0])).toEqual(test[1]);
    }
  });

  it('should encode/decode a string', async () => {
    for (const test of DecodingTests) {
      const encoded = await encrypt(test[1], test[0]);
      const decoded = await decrypt(encoded, test[0]);
      expect(decoded).toEqual(test[1]);
    }
  });
});
