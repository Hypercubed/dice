import { Injectable } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

const DEBUG = false;

// Constants to match OpenSSL output
const iterations = 10000;
const SALT_LEN = 8;
const KEY_LEN = 32;
const IV_LEN = 16;
const KEY_BITS = (KEY_LEN + IV_LEN) * 8;

const OpenSSLHeader = convertStringToArrayBufferView('Salted__');

const KeyAlgorithm = 'PBKDF2';
const EncAlgorithm = 'AES-CBC';
const Hasher = 'SHA-256';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  constructor(public sanitizer: DomSanitizer) {}

  async encode(message: string, password: string): Promise<string> {
    message = (message || '').trim();
    password = (password || '').trim();

    if (!message || !password) return '';

    const saltBuffer = this.getRandomSaltBuffer();
    const derivation = await this.getDerivationBits(saltBuffer, password);
    const keyObject = await this.getKey(derivation);

    const textEncoder = new TextEncoder();
    const textBuffer = textEncoder.encode(message);
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: EncAlgorithm, iv: keyObject.iv },
      keyObject.key,
      textBuffer
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);

    const mergedArray = new Uint8Array(OpenSSLHeader.length + saltBuffer.length + encryptedBytes.length);
    mergedArray.set(OpenSSLHeader);
    mergedArray.set(saltBuffer, OpenSSLHeader.length);
    mergedArray.set(encryptedBytes, OpenSSLHeader.length + saltBuffer.length);

    const encoded = arrayBufferToBase64(mergedArray.buffer);

    const decrypt = await this.decode(encoded, password);
    if (decrypt !== message) {
      throw new Error('Encrypted message failed to decrypt');
    }

    return encoded;
  }

  async decode(encrypted: string, password: string): Promise<string> {
    encrypted = (encrypted || '').replace(/\s/g, '');
    password = (password || '').trim();

    if (!encrypted || !password) return '';

    try {
      const params = Array.from(atob(encrypted)).map((c) => c.charCodeAt(0));
      const header = params.slice(0, OpenSSLHeader.length); // TODO: check header

      if (header.join('') !== OpenSSLHeader.join('')) {
        throw new Error('Invalid header');
      }

      const salt = params.slice(OpenSSLHeader.length, OpenSSLHeader.length + SALT_LEN);
      const data = params.slice(OpenSSLHeader.length + SALT_LEN);

      const textDecoder = new TextDecoder('utf-8');
      const encryptedData = new Uint8Array(data);
      const saltBuffer = new Uint8Array(salt);

      const derivation = await this.getDerivationBits(saltBuffer, password);
      const keyObject = await this.getKey(derivation);

      const decryptedText = await crypto.subtle.decrypt(
        { name: EncAlgorithm, iv: keyObject.iv },
        keyObject.key,
        encryptedData
      );
      const text = textDecoder.decode(decryptedText);

      return text;
    } catch (error) {
      console.error('Error decoding', error);
      return '';
    }
  }

  private getRandomSaltBuffer(): Uint8Array {
    DEBUG && console.time('getRandomSaltBuffer');
    const saltBuffer = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
    DEBUG && console.timeEnd('getRandomSaltBuffer');

    return saltBuffer;
  }

  private async getDerivationBits(saltBuffer: Uint8Array, password: string): Promise<ArrayBuffer> {
    const textEncoder = new TextEncoder();
    const passwordBuffer = textEncoder.encode(password);
    DEBUG && console.time('getDerivationBits');
    const importedKey = await crypto.subtle.importKey('raw', passwordBuffer, KeyAlgorithm, false, ['deriveBits']);
    const bits = crypto.subtle.deriveBits(
      { name: KeyAlgorithm, hash: Hasher, salt: saltBuffer, iterations: iterations },
      importedKey,
      KEY_BITS
    );
    DEBUG && console.timeEnd('getDerivationBits');

    return bits;
  }

  private async getKey(derivation: ArrayBuffer) {
    const derivedKey = derivation.slice(0, KEY_LEN);
    const iv = derivation.slice(KEY_LEN);
    DEBUG && console.time('getKey');
    const importedEncryptionKey = await crypto.subtle.importKey('raw', derivedKey, { name: EncAlgorithm }, false, [
      'encrypt',
      'decrypt',
    ]);
    DEBUG && console.timeEnd('getKey');

    return {
      key: importedEncryptionKey,
      iv: iv,
    };
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function convertStringToArrayBufferView(str: string) {
  var bytes = new Uint8Array(str.length);
  for (var iii = 0; iii < str.length; iii++) {
    bytes[iii] = str.charCodeAt(iii);
  }

  return bytes;
}
