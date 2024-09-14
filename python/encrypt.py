from salted import encrypt, litering_by_three

import base64

plaintext = 'Hello World!'
password = 'p4$$w0rd'
openssloutputb64 = encrypt(plaintext, password)
openssloutputbytes = base64.b64decode(openssloutputb64)

# output results
print('plaintext: ', plaintext)
print('password:', password)
print('openssl output b64:', openssloutputb64)
print('openssl output base64url:', base64.urlsafe_b64encode(
    openssloutputbytes).decode('utf-8'))
print('openssl output base64 (padded):', litering_by_three(openssloutputb64))
