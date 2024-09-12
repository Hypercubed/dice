#from https://stackoverflow.com/a/61165770

import binascii
import base64
import hashlib
from Crypto.Cipher import AES       #requires pycrypto

#inputs
openssloutputb64='U2FsdGVkX1/Kf8Yo6JjBh+qELWhirAXr78+bbPQjlxE='
password='p4$$w0rd'
pbkdf2iterations=10000

#convert inputs to bytes
openssloutputbytes=base64.b64decode(openssloutputb64)
passwordbytes=password.encode('utf-8')

#salt is bytes 8 through 15 of openssloutputbytes
salt=openssloutputbytes[8:16]

#derive a 48-byte key using pbkdf2 given the password and salt with 10,000 iterations of sha256 hashing
derivedkey=hashlib.pbkdf2_hmac('sha256', passwordbytes, salt, pbkdf2iterations, 48)

#key is bytes 0-31 of derivedkey, iv is bytes 32-47 of derivedkey
key=derivedkey[0:32]
iv=derivedkey[32:48]

#ciphertext is bytes 16-end of openssloutputbytes
ciphertext=openssloutputbytes[16:]

#decrypt ciphertext using aes-cbc, given key, iv, and ciphertext
decryptor=AES.new(key, AES.MODE_CBC, iv)
plaintext=decryptor.decrypt(ciphertext)

#remove PKCS#7 padding.
#Last byte of plaintext indicates the number of padding bytes appended to end of plaintext.  This is the number of bytes to be removed.
plaintext = plaintext[:-plaintext[-1]]

#output results
print('openssloutputb64:', openssloutputb64)
print('password:', password)
print('salt:', salt.hex())
print('key: ', key.hex())
print('iv: ', iv.hex())
print('ciphertext: ', ciphertext.hex())
print('plaintext: ', plaintext.decode('utf-8'))
