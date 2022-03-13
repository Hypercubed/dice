import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import CryptoJS from 'crypto-js';

const { WordArray } = CryptoJS.lib;
const { Utf8 } = CryptoJS.enc;
const { OpenSSL } = CryptoJS.format;
const { AES } = CryptoJS;
export type WordArray = CryptoJS.lib.WordArray;

const DEBUG = false;

// Constants to match OpenSSL output
const hasher = CryptoJS.algo.SHA256;
const iterations = 10000;
const SALT_WORDS = 8 / 4;
const KEY_WORDS = 32 / 4;
const IV_WORDS = 16 / 4;
const keySize = KEY_WORDS + IV_WORDS;

const PBKDF2 = CryptoJS.algo.PBKDF2.create({ keySize, iterations, hasher });

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  constructor(public sanitizer: DomSanitizer) {}

  getKey(password: string): [WordArray, WordArray, WordArray] {
    password = (password || '').trim();
    DEBUG && console.time('salt');
    const salt = WordArray.random(SALT_WORDS * 4);
    DEBUG && console.timeEnd('salt');

    DEBUG && console.time('pbkdf2');
    const pbk = this.pbkdf2(password, salt);
    DEBUG && console.timeEnd('pbkdf2');

    return [...pbk, salt];
  }

  encode2(message: string, key: any, iv: any, salt: any) {
    message = (message || '').trim();

    DEBUG && console.time('encrypt');
    const cipherParams = AES.encrypt(message, key, { iv });
    DEBUG && console.timeEnd('encrypt');

    cipherParams.salt = salt;

    return OpenSSL.stringify(cipherParams);
  }

  encode(message: string, password: string) {
    message = (message || '').trim();
    password = (password || '').trim();

    const [key, iv, salt] = this.getKey(password);
    return this.encode2(message, key, iv, salt);
  }

  decode(encrypted: string, password: string) {
    encrypted = (encrypted || '').replace(/\s/g, '');
    password = (password || '').trim();

    try {
      const cipherParams = OpenSSL.parse(encrypted);
      const [key, iv] = this.pbkdf2(password, cipherParams.salt);

      return AES.decrypt(cipherParams, key, { iv }).toString(Utf8);
    } catch (_err) {
      return '';
    }
  }

  private pbkdf2(password: string, salt: WordArray): [WordArray, WordArray] {
    const keyIv = PBKDF2.compute(password, salt);

    const key = WordArray.create(keyIv.words.slice(0, KEY_WORDS));
    const iv = WordArray.create(
      keyIv.words.slice(KEY_WORDS, keyIv.words.length)
    );

    return [key, iv];
  }
}
