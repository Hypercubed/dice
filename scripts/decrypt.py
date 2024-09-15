from salted import decrypt, litering_by_three

import base64

openssloutputb64 = 'U2FsdGVkX1/Kf8Yo6JjBh+qELWhirAXr78+bbPQjlxE='
password = 'p4$$w0rd'
plaintext = decrypt(openssloutputb64, password)
openssloutputbytes = base64.b64decode(openssloutputb64)

# output results
print('openssl output b64:', openssloutputb64)
print('openssl output base64url:', base64.urlsafe_b64encode(
    openssloutputbytes).decode('utf-8'))
print('openssl output base64 (padded):', litering_by_three(openssloutputb64))
print('password:', password)
print('plaintext: ', plaintext)
