import base64
import hashlib
from Crypto.Cipher import AES  # requires pycrypto
from Crypto import Random

# options
ITER = 10000
CIPHER = AES
MODE = AES.MODE_CBC
DIGEST = 'sha256'
HEADER = b'Salted__'


def get_key_and_iv(password, salt):
    passwordbytes = password.encode('utf-8')
    derivedkey = hashlib.pbkdf2_hmac(
        DIGEST, passwordbytes, salt, ITER, 48)

    # key is bytes 0-31 of derivedkey, iv is bytes 32-47 of derivedkey
    key = derivedkey[0:32]
    iv = derivedkey[32:48]

    return key, iv


def decrypt(encoded_text, password):
    '''
    Decrypt the ciphertext using the password using an openssl
    compatible decryption algorithm. It is the same as running openssl like this:

    $ echo -n <encoded_text> | openssl enc -d -aes-256-cbc -A -base64 -pbkdf2 -md sha256 -iter 10000 pass:<password>
    '''

    # convert inputs to bytes
    openssloutputbytes = base64.b64decode(encoded_text)

    # salt is bytes 8 through 15 of openssloutputbytes
    salt = openssloutputbytes[8:16]

    key, iv = get_key_and_iv(password, salt)

    # ciphertext is bytes 16-end of openssloutputbytes
    ciphertext = openssloutputbytes[16:]

    # decrypt ciphertext using aes-cbc, given key, iv, and ciphertext
    decryptor = CIPHER.new(key, MODE, iv)
    plaintext = decryptor.decrypt(ciphertext)

    # remove PKCS#7 padding.
    # Last byte of plaintext indicates the number of padding bytes appended to end of plaintext.  This is the number of bytes to be removed.
    return plaintext[:-plaintext[-1]].decode('utf-8')


def encrypt(plaintext, password):
    '''
    Encrypt the plaintext using the password using an openssl
    compatible encryption algorithm. It is the same as running openssl like this:

    $ echo <plaintext> | openssl enc -e -aes-256-cbc -A -base64 -pbkdf2 -md sha256 -iter 10000 pass:<password>
    '''

    # generate a random 8-byte salt
    bs = AES.block_size
    salt = Random.new().read(8)

    # PKCS#7 padding
    padding_len = 16 - (len(plaintext) % 16)
    padded_plaintext = plaintext + (chr(padding_len) * padding_len)

    key, iv = get_key_and_iv(password, salt)

    # encrypt ciphertext using aes-cbc, given key, iv, and ciphertext
    encryptor = CIPHER.new(key, MODE, iv)
    ciphertext = encryptor.encrypt(padded_plaintext.encode('utf-8'))
    openssloutputbytes = HEADER + salt + ciphertext

    return base64.b64encode(openssloutputbytes).decode('utf-8')


def litering_by_three(a):
    return " ".join([a[::-1][i:i+4] for i in range(0, len(a), 4)])[::-1]
