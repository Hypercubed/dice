import { decode as decodeSafeBase64, isBase64, isUrlSafeBase64 } from 'url-safe-base64';

// Constants to match OpenSSL output
const SALT_LEN = 8;
const KEY_LEN = 32;
const IV_LEN = 16;
const KEY_BITS = (KEY_LEN + IV_LEN) * 8;
const OpenSSLHeader = convertStringToArrayBufferView('Salted__');

const DEBUG = false;

interface EncryptionOptions {
  iterations: number;
  keyAlgorithm: 'PBKDF2' | string;
  encAlgorithm: 'AES-CBC' | string;
  hashAlgorithm: 'SHA-256' | string;
}

const DefaultOptions: EncryptionOptions = {
  iterations: 10000,
  keyAlgorithm: 'PBKDF2',
  encAlgorithm: 'AES-CBC',
  hashAlgorithm: 'SHA-256',
};

export async function encrypt(
  message: string,
  password: string,
  options?: Partial<EncryptionOptions>
): Promise<string> {
  const _options = { ...DefaultOptions, ...options };

  message = (message || '').trim();
  password = (password || '').trim();

  if (!message || !password) return '';

  const saltBuffer = getRandomSaltBuffer();
  const derivation = await getDerivationBits(saltBuffer, password, _options);
  const keyObject = await getKey(derivation, _options);

  const textEncoder = new TextEncoder();
  const textBuffer = textEncoder.encode(message);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: _options.encAlgorithm, iv: keyObject.iv },
    keyObject.key,
    textBuffer
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);

  const mergedArray = new Uint8Array(OpenSSLHeader.length + saltBuffer.length + encryptedBytes.length);
  mergedArray.set(OpenSSLHeader);
  mergedArray.set(saltBuffer, OpenSSLHeader.length);
  mergedArray.set(encryptedBytes, OpenSSLHeader.length + saltBuffer.length);

  const encoded = arrayBufferToBase64(mergedArray.buffer);

  const decrypted = await decrypt(encoded, password);
  if (decrypted !== message) {
    throw new Error('Encrypted message failed to decrypt');
  }

  return encoded;
}

export async function decrypt(
  encrypted: string,
  password: string,
  options?: Partial<EncryptionOptions>
): Promise<string> {
  const _options = { ...DefaultOptions, ...options };

  encrypted = cleanupEncodedText(encrypted || '');
  validateEncodedText(encrypted);

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

    const derivation = await getDerivationBits(saltBuffer, password, _options);
    const keyObject = await getKey(derivation, _options);

    const decryptedText = await crypto.subtle.decrypt(
      { name: _options.encAlgorithm, iv: keyObject.iv },
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

async function getDerivationBits(
  saltBuffer: Uint8Array,
  password: string,
  options: EncryptionOptions
): Promise<ArrayBuffer> {
  const textEncoder = new TextEncoder();
  const passwordBuffer = textEncoder.encode(password);
  DEBUG && console.time('getDerivationBits');
  const importedKey = await crypto.subtle.importKey('raw', passwordBuffer, options.keyAlgorithm, false, ['deriveBits']);
  const bits = crypto.subtle.deriveBits(
    { name: options.keyAlgorithm, hash: options.hashAlgorithm, salt: saltBuffer, iterations: options.iterations },
    importedKey,
    KEY_BITS
  );
  DEBUG && console.timeEnd('getDerivationBits');

  return bits;
}

async function getKey(
  derivation: ArrayBuffer,
  options: EncryptionOptions
): Promise<{ key: CryptoKey; iv: ArrayBuffer }> {
  const derivedKey = derivation.slice(0, KEY_LEN);
  const iv = derivation.slice(KEY_LEN);
  DEBUG && console.time('getKey');
  const key = await crypto.subtle.importKey('raw', derivedKey, { name: options.encAlgorithm }, false, [
    'encrypt',
    'decrypt',
  ]);
  DEBUG && console.timeEnd('getKey');

  return {
    key,
    iv,
  };
}

function getRandomSaltBuffer(): Uint8Array {
  DEBUG && console.time('getRandomSaltBuffer');
  const saltBuffer = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
  DEBUG && console.timeEnd('getRandomSaltBuffer');

  return saltBuffer;
}

function convertStringToArrayBufferView(str: string) {
  var bytes = new Uint8Array(str.length);
  for (var iii = 0; iii < str.length; iii++) {
    bytes[iii] = str.charCodeAt(iii);
  }

  return bytes;
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

export function cleanupEncodedText(encoded: string) {
  if (encoded.includes('http')) {
    // remove URL
    const segments = encoded.split('/');
    encoded = segments[segments.length - 1];
  }
  encoded = encoded.replace(/\s/g, ''); // remove whitespace
  if (isUrlSafeBase64(encoded)) {
    // convert URL-safe base64 to base64
    encoded = decodeSafeBase64(encoded);
  }
  encoded = encoded.replace(/=*$/g, ''); // remove padding
  return encoded;
}

function validateEncodedText(encoded: string) {
  if (!encoded.startsWith('U2FsdGVkX1')) throw new Error('Invalid encoded text');
  if (!isBase64(encoded)) throw new Error('Invalid base64 encoding');
  return true;
}
