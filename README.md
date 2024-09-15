# Dice

Tired of worrying about your sensitive data getting into the wrong hands? DICE is here to provide a secure and convenient solution.

Decode in case of Emergency (DICE) is a simple online and open-source tool to convert confidential messages into encrypted QRCodes to be decoded in case of emergency.

Messages are encoded using an encryption password and aes-256-cbc encryption, the same as the one used in the [OpenSSL cli tool](https://wiki.openssl.org/index.php/Command_Line_Utilities). All encryption and decryption happens within the browser and never sent to any server. Feel free to deploy your own server for this tool but don't worry messages can always be decrypted using the OpenSSL cli tool.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/hypercubed)

## Use Case

Protect Your Offline Secrets and Emergency Messages:

- **Backup Codes**: Generate QR codes for your two-factor authentication backup codes. Print them and store them in a safe place.
- **Passwords**: Create QR codes for your most important passwords. Scan them with DICE when needed, ensuring secure and offline access.
- **Emergency Messages**: Encrypt and store important messages for loved ones in case of an emergency.

## Key Benefits

- **Industry-Standard Encryption**: DICE uses proven encryption methods, ensuring the highest level of security for your data.
- **Decodable with Common Tools**: Your DICE-encrypted data can be decoded using widely available command-line tools, giving you flexibility and control.
- **Open-Source and Transparent**: DICE is completely open-source, allowing you to inspect and verify its code.
- **Offline PWA for Mobile and Desktop**: Run DICE as a Progressive Web App (PWA) for a standalone, offline-capable experience on both mobile and desktop devices.

## How to use

DICE is designed to be easily deployed to any static hosting sites. Feel free to clone and deploy DICE to your own site or use one of the following deployments:

### Auto-deployed from this repo

- https://hypercubed.github.io/dice/
- https://dice-on.netlify.app/
- https://dice-on.vercel.app/

### Manual deployments (may be out of date)

- https://dice.hypercubed.repl.co/
- https://dice-on.surge.sh/
- https://dice-on.glitch.me/
- http://dice-on.s3-website-us-east-1.amazonaws.com/
- https://gateway.pinata.cloud/ipfs/QmboFxoGxf3PSkYASZ2X56Pwv6quKrcW6sdoCdqVRgSMeX/#/
- https://hypercubed.itch.io/dice

### Encoding Method, Compatibility with OpenSSL

Text is encrypted using AES (with PBKDF2, CBC block and random IV) then base64 encoded using the same method used by `openssl`. `openssl` encryption and decryption command lines are shown below. The QR code is generated from the base64 encoded encrypted text and the current application URL (optionally disabled). If the the QR code is generated with the application URL, the encrypted text URL safe encoded and appended to the URL as a query parameter.

Encode:

```sh
> echo "Hello World!" | openssl enc -e -aes-256-cbc -A -base64 -pbkdf2 -md sha256 -iter 10000
enter aes-256-cbc encryption password:
Verifying - enter aes-256-cbc encryption password:
U2FsdGVkX1/Kf8Yo6JjBh+qELWhirAXr78+bbPQjlxE=
```

Decode:

```sh
> echo -n "U2FsdGVkX1/Kf8Yo6JjBh+qELWhirAXr78+bbPQjlxE=" | openssl enc -d -aes-256-cbc -A -base64 -pbkdf2 -md sha256 -iter 10000
enter aes-256-cbc decryption password:
Hello World!
```

If the encrypted value contains spaces, they should be removed before decoding or use [basenc](https://man7.org/linux/man-pages/man1/basenc.1.html) (`basenc -di --base64`) to "ignore junk" before passing to openssl (see example below). Notice that the `-A -base64` flags are removed from the `openssl` command line since `basenc` will decode the base64 encoded string.

```sh
> echo -n "U2Fs dGVk X1/K f8Yo 6JjB h+qE LWhi rAXr 78+b bPQj lxE=" | basenc -di --base64 | openssl enc -d -aes-256-cbc -pbkdf2 -md sha256 -iter 10000
```

If the encrypted value contains `-` or `_` characters, they should be replaced with `+` and `/` respectively before decoding. This is only needed if the encrypted value was extracted from a URL embedded in a QRCode by DICE. You may also use [basenc](https://man7.org/linux/man-pages/man1/basenc.1.html) (`basenc -di --base64url`) to URL safe base64 decode the encrypted value before passing to openssl (see example below).

```sh
echo -n "U2FsdGVkX1_Kf8Yo6JjBh-qELWhirAXr78-bbPQjlxE=" | basenc -di --base64url | openssl enc -d -aes-256-cbc -pbkdf2 -md sha256 -iter 10000
```

> **Note:** The `openssl` command on MacOS may point to LibreSSL. If so you may need to install OpenSSL.

> **Note:** The `echo` command on Windows/DOS may look a little different. Try removing the `-n` flag and quotes.

## More About DICE

DICE was created by Jayson Harshbarger (Hypercubed). Born out of a personal need for a secure and reliable way to store sensitive information offline. As someone who values control over my data, I found existing solutions lacking in either security or convenience.

I began developing DICE several years ago and have used it personally to protect my backup codes, and other confidential information. The experience has been invaluable, and I've witnessed firsthand how it can safeguard your digital life.

Driven by a desire to share this tool with others, I decided to release DICE as open-source. By making it freely available, I hope to empower individuals to take control of their digital security and protect their privacy.

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/hypercubed)

## License (The MIT License)

Copyright (c) 2022-2024 J. Harshbarger

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
