# Dice

Decode in case of Emergency (DICE) is a simple online and open-source tool to convert confidential messages into encrypted QRCodes to be decoded in case of emergency.

Messages are encoded using an encryption password and aes-256-cbc encryption, the same as the one used in the [OpenSSL cli tool](https://wiki.openssl.org/index.php/Command_Line_Utilities). All encryption and decryption happens within the browser and never sent to any server. Feel free to deploy your own server for this tool but don't worry messages can always be decrypted using the OpenSSL cli tool.

## How to use

DICE is designed to be easily deployed to any static hosting sites. Feel free to clone and deploy DICE to your own site or use one of the following deployments:

### Auto-deployed from this repo

- https://hypercubed.github.io/dice/
- https://dice-ipfs.on.fleek.co/
- https://dice-on.netlify.app/
- https://dice-on.vercel.app/

### Manual deployments (may be out of date)

- https://dice.hypercubed.repl.co/
- https://dice-on.surge.sh/
- https://dice-on.glitch.me/
- http://dice-on.s3-website-us-east-1.amazonaws.com/
- https://gateway.pinata.cloud/ipfs/QmboFxoGxf3PSkYASZ2X56Pwv6quKrcW6sdoCdqVRgSMeX/#/
- https://hypercubed.itch.io/dice

### Encoding Method

Text is encrypted using AES (with PBKDF2, CBC block and random IV) then base64 encoded using the same method used by `openssl`. `openssl` encryption and decryption command lines are shown below. The QR code is generated from the url safe base64 encoded encrypted text and the current application url (optionally disabled).

Examples:

```sh
> echo "secret message" | openssl enc -e -aes-256-cbc -base64 -A -pbkdf2
enter aes-256-cbc encryption password:
Verifying - enter aes-256-cbc encryption password:
U2FsdGVkX1+YgsU2eR8IuwEu8vBpQY6cvTU5jcx66Fc=

> echo -n "U2FsdGVkX1+YgsU2eR8IuwEu8vBpQY6cvTU5jcx66Fc=" | openssl enc -d -aes-256-cbc -base64 -A -pbkdf2
enter aes-256-cbc decryption password:
secret message
```

> **Note:** The `openssl` command on MacOS may point to LibreSSL. If so you may need to install OpenSSL.

> **Note:** The `echo` command on Windows/DOS may look a little different. Try removing the `-n` flag and quotes.

## License

This project is licensed under the MIT License - see the LICENSE file for details
