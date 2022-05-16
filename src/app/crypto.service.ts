import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import CryptoJS from 'crypto-js';
import { base64, base32 } from 'rfc4648';

const { WordArray, CipherParams } = CryptoJS.lib;
const { PBKDF2, SHA256 } = CryptoJS.algo;
const { Utf8 } = CryptoJS.enc;
const { AES, MD5 } = CryptoJS;

type WordArray = CryptoJS.lib.WordArray;
type CipherParams = CryptoJS.lib.CipherParams;

const DEBUG = false;

// Constants to match OpenSSL output
const hasher = SHA256;
const iterations = 10000;
const SALT_WORDS = 8 / 4;
const KEY_WORDS = 32 / 4;
const IV_WORDS = 16 / 4;
const keySize = KEY_WORDS + IV_WORDS;

enum METHOD {
  OPENSSL_BASE64 = 'OpenSSL base64',
  OPENSSL_BASE32 = 'OpenSSL base32',
}

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  PBKDF2 = PBKDF2.create({ keySize, iterations, hasher });

  constructor(public sanitizer: DomSanitizer) {}

  encode(message: string, password: string, method = METHOD.OPENSSL_BASE32): string {
    message = (message || '').trim();
    password = (password || '').trim();

    if (!message || !password) return '';

    const phraseHash = this.hash(message);
    let encoded = '';

    const wa = this.encode_OpenSSL(message, password);
    const ba = wordArray_to_uint8Array(wa);

    switch (method) {
      case METHOD.OPENSSL_BASE32: {
        const wa = this.encode_OpenSSL(message, password);
        const ba = wordArray_to_uint8Array(wa);
        encoded = base32.stringify(ba);
        break;
      }
      case METHOD.OPENSSL_BASE64: {
        const wa = this.encode_OpenSSL(message, password);
        const ba = wordArray_to_uint8Array(wa);
        encoded = base64.stringify(ba);
        break;
      }
    }

    // Integrity check
    const decrypt = this.decode(encoded, password);
    if (phraseHash !== this.hash(decrypt)) {
      throw new Error('Encrypted message failed to decrypt');
    }

    return encoded;
  }

  decode(encrypted: string, password: string): string {
    encrypted = (encrypted || '').replace(/\s/g, '');
    password = (password || '').trim();

    const method = this.getMethod(encrypted) || METHOD.OPENSSL_BASE64;

    switch (method) {
      case METHOD.OPENSSL_BASE64: {
        const ba = base64.parse(encrypted, { loose: true });
        const wa = WordArray.create(ba as unknown as number[]);
        return this.decode_OpenSSL(wa, password);
      }
      case METHOD.OPENSSL_BASE32: {
        const ba = base32.parse(encrypted, { loose: true });
        const wa = WordArray.create(ba as unknown as number[]);
        return this.decode_OpenSSL(wa, password);
      }
    }
  }

  getMethod(encrypted: string): METHOD | undefined {
    if (encrypted.startsWith('U2Fs')) {
      return METHOD.OPENSSL_BASE64;
    }
    if (encrypted.startsWith('KNQW')) {
      return METHOD.OPENSSL_BASE32;
    }
    return undefined;
  }

  private getKey(password: string): [WordArray, WordArray, WordArray] {
    password = (password || '').trim();
    DEBUG && console.time('salt');
    const salt = WordArray.random(SALT_WORDS * 4);
    DEBUG && console.timeEnd('salt');

    DEBUG && console.time('pbkdf2');
    const pbk = this.pbkdf2(password, salt);
    DEBUG && console.timeEnd('pbkdf2');

    return [...pbk, salt];
  }

  private encode_OpenSSL(message: string, password: string): WordArray {
    const [key, iv, salt] = this.getKey(password);
    DEBUG && console.time('encrypt');
    const cipherParams = AES.encrypt(message, key, { iv });
    DEBUG && console.timeEnd('encrypt');

    cipherParams.salt = salt;

    return this.stringify_OpenSSL(cipherParams);
  }

  private decode_OpenSSL(wordArray: WordArray, password: string): string {
    const cipherParams = this.parse_OpenSSL(wordArray);
    const [key, iv] = this.pbkdf2(password, cipherParams.salt);
    return AES.decrypt(cipherParams, key, { iv }).toString(Utf8);
  }

  private hash(message: string) {
    message = (message || '').trim();
    return MD5(message).toString();
  }

  private pbkdf2(password: string, salt: WordArray): [WordArray, WordArray] {
    const keyIv = this.PBKDF2.compute(password, salt);

    const key = WordArray.create(keyIv.words.slice(0, KEY_WORDS));
    const iv = WordArray.create(keyIv.words.slice(KEY_WORDS, keyIv.words.length));

    return [key, iv];
  }

  private stringify_OpenSSL(cipherParams: CipherParams): WordArray {
    const ciphertext = cipherParams.ciphertext;
    const salt = cipherParams.salt;
    return salt ? WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext) : ciphertext;
  }

  private parse_OpenSSL(ciphertext: WordArray): CipherParams {
    let salt;

    const ciphertextWords = ciphertext.words;

    // Test for salt
    if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
      // Extract salt
      salt = WordArray.create(ciphertextWords.slice(2, 4));

      // Remove salt from ciphertext
      ciphertextWords.splice(0, 4);
      ciphertext.sigBytes -= 16;
    }

    return CipherParams.create({ ciphertext, salt });
  }
}

function wordArray_to_uint8Array(wordArray: WordArray): Uint8Array {
  const len = wordArray.words.length;
  const u8_array = new Uint8Array(len << 2);
  let offset = 0;
  let word, i;

  for (i = 0; i < len; i++) {
    word = wordArray.words[i];
    u8_array[offset++] = word >> 24;
    u8_array[offset++] = (word >> 16) & 0xff;
    u8_array[offset++] = (word >> 8) & 0xff;
    u8_array[offset++] = word & 0xff;
  }
  return u8_array;
}
