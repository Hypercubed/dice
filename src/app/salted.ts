import { decode as decodeSafeBase64, isBase64, isUrlSafeBase64 } from 'url-safe-base64';

// Constants to match OpenSSL output
const SALT_LEN = 8;
const KEY_LEN = 32;
const IV_LEN = 16;
const KEY_BITS = (KEY_LEN + IV_LEN) * 8;

const Salted = 'Salted__';
const SaltedBase64 = btoa(Salted).slice(0, 9);

const DEBUG = false;

interface EncryptionOptions {
  iterations: number;
  keyAlgorithm: 'PBKDF2' | string;
  encAlgorithm: 'AES-CBC' | string;
  hashAlgorithm: 'SHA-256' | string;
  integrityCheck?: boolean;
}

const DefaultOptions: EncryptionOptions = {
  iterations: 10000,
  keyAlgorithm: 'PBKDF2',
  encAlgorithm: 'AES-CBC',
  hashAlgorithm: 'SHA-256',
  integrityCheck: true,
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
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: _options.encAlgorithm, iv: keyObject.iv },
    keyObject.key,
    textEncoder.encode(message)
  );

  const encodedBuffer = concatBuffers([textEncoder.encode(Salted), saltBuffer, encryptedBuffer]);
  const encoded = bufferToBase64(encodedBuffer);

  if (_options.integrityCheck) {
    const decrypted = await decrypt(encoded, password);
    if (decrypted !== message) {
      throw new Error('Encrypted message failed to decrypt');
    }
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

  const encryptedBuffer = base64ToBuffer(encrypted);

  const salt = encryptedBuffer.slice(Salted.length, Salted.length + SALT_LEN);
  const data = encryptedBuffer.slice(Salted.length + SALT_LEN);

  const derivation = await getDerivationBits(salt, password, _options);
  const { iv, key } = await getKey(derivation, _options);

  const decryptedText = await crypto.subtle.decrypt({ name: _options.encAlgorithm, iv }, key, data);

  const textDecoder = new TextDecoder();
  return textDecoder.decode(decryptedText);
}

async function getDerivationBits(
  saltBuffer: BufferSource,
  password: string,
  options: EncryptionOptions
): Promise<ArrayBuffer> {
  const textEncoder = new TextEncoder();
  DEBUG && console.time('getDerivationBits');
  const importedKey = await crypto.subtle.importKey('raw', textEncoder.encode(password), options.keyAlgorithm, false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
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

export function validateEncodedText(encoded: string) {
  if (!encoded.startsWith(SaltedBase64)) throw new Error('Invalid encoded text');
  if (!isBase64(encoded)) throw new Error('Invalid base64 encoding');
  return true;
}

//  ************ BUFFER UTILS ************

function concatBuffers(buffers: Array<Uint8Array | ArrayBuffer>): Uint8Array {
  // Calculate total length
  const totalLength = buffers.reduce((acc, buf) => acc + buf.byteLength, 0);

  // Create a new ArrayBuffer
  const result = new ArrayBuffer(totalLength);

  // Create a view to write data
  const view = new Uint8Array(result);

  // Copy data from each buffer
  let offset = 0;
  buffers.forEach((buffer) => {
    view.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  });

  return view;
}

function base64ToBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
