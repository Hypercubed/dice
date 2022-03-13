# Dice

Decode in case of Emergency (DICE) is a simple online and open-source tool to convert confidential messages into encrypted QRCodes to be shared with your loved ones and decoded in case of emergency.

Messages are encoded using an encryption password and aes-256-cbc encryption, the same as the one used in the [OpenSSL cli tool](https://wiki.openssl.org/index.php/Command_Line_Utilities).  All encryption and decryption happens within the browser and never sent to any server.  Feel free to deploy your own server for this tool but don't worry messages can always be decrypted using the OpenSSL cli tool.

## How to use

DICE is designed to be easily deployed to any static hosting sites.  Feel free to clone and deploy DICE to your own site or use one of the following deployments:

### Auto-deployed from this repo

- https://hypercubed.github.io/dice/
- https://dice-ipfs.on.fleek.co/
- https://dice-on.netlify.app/
- https://dice-on.vercel.app/

### Manual deployments (may be out of date)

- https://dice.hypercubed.repl.co/
- https://dice-on.surge.sh/
- http://dice-on.s3-website-us-east-1.amazonaws.com/
- https://gateway.pinata.cloud/ipfs/QmboFxoGxf3PSkYASZ2X56Pwv6quKrcW6sdoCdqVRgSMeX/#/

### Encoding

1. Enter an encryption password.  This pass phase is shared with your intended recipient(s).

2. Enter text to encrypt.  The text will be encrypted using the encryption password you entered.

3. Download QR Code or encrypted text.  This is the QR code you can embed in your document and store for an emergency.

> **Using OpenSSL:** `echo -n "{{secret message}}" | openssl enc -e -aes-256-cbc - -base64 -pbkdf2`

### Decoding

1. Enter an encryption password.  This password that was shared with your.

2. Scan the QR code or enter the encrypted text.  The text will be decrypted using the encryption password you entered.

3. Decrypted Text is displayed.

> **Using OpenSSL:** `echo -n "{{encrypted message}}" | openssl enc -d -aes-256-cbc -A -base64 -pbkdf2`

## License

This project is licensed under the MIT License - see the LICENSE file for details
