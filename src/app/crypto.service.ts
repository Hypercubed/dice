import { Injectable } from '@angular/core';
import { decrypt, encrypt } from './salted';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  async encode(message: string, password: string): Promise<string> {
    return encrypt(message, password);
  }

  async decode(encrypted: string, password: string): Promise<string> {
    return decrypt(encrypted, password);
  }
}
