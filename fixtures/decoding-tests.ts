export const DecodingTests = [
  // Encoded using Dice
  ['nO62tPMSge', 'Ambrosi', 'U2FsdGVkX18G7u+bUTUSmf7daGUYWzT1wbVJ4V7hMZM='],
  ['2dUEV0CuZ6', 'Bethena', 'U2FsdGVkX19356LNnbjF2FcJ4+6h2BD2HUUWKqXfcvg='],
  [
    'u3g2sk6DC',
    'Nulla nisl. Nunc nisl. Duis bibendum',
    'U2FsdGVkX1/3Mi024kJj66/n3Rk5jTpkLB+7rn5vbcueLmdBN2z0RF2tJpdExvo6XstxuL/P2pCVZRJgPlbTLw==',
  ],
  // Encoded using OpenSSL 1.1.1f
  ['9WPwJ8gRkJI', 'Marna', 'U2FsdGVkX19r0SsJRSfRdQ84pccyMNOgqEz6DZ3tl2Y='],
  ['QAseekbshO6', 'Jerrie', 'U2FsdGVkX1/XXp5JsPO8I8J1KfqWKHwfPpUywUx4Nx4='],
  [
    'u3g2sk6DC',
    'Nulla nisl. Nunc nisl. Duis bibendum',
    'U2FsdGVkX1/RL2eQscpOk4coH+oCkR50ei/rFYTCqeqTjpAX6G/iavF1Su3l05j0EuBKSCwgaeymu+qFeKYD2Q==',
  ],
  // Encoded using OpenSSL 1.1.1m
  ['PAAxipHavI', 'Rustidge', 'U2FsdGVkX1+c6iWxTaCX77vrpz3h+JNmK0z89MvxDaM='],
  [
    'Did you see a small dog with a red collar',
    'The coffee shop closes at midnight',
    'U2FsdGVkX1/YB40FRxDAbPh1pD1vm69kaNi3JMT5vv34tbUmSvd5xYE+GdjLfNIg9/xvdIv+RQF9HBIAPim/Yg==',
  ],
  // Encoded using LibreSSL 3.4.2
  [
    'Virtual grid-enabled moderator',
    'Reduced analyzing knowledge base',
    'U2FsdGVkX19loYHdQu3erlXT/1j4XPee+yFtxKpA+WOSpOa8zqZgu+yxSzC1xxlaAlmzPunXhIG6laelq3EPbQ==',
  ],
  // Base64 Encoded
  ['p4$$w0rd', 'Hello World!', 'U2FsdGVkX1+AmMQPgqEHqep6rOjycI6oFSW7DTmNs/k='],
  // base64url Encoded
  ['p4$$w0rd', 'Hello World!', 'U2FsdGVkX1_zTado483L_ww6wAOKHbcVBu--T8bYCl0='],
  // base64 Encoded + padding
  ['p4$$w0rd', 'Hello World!', 'U2Fs dGVk X1+M oDtu MDcj YEGI KSFK Y2Z3 k7xw Tfid 9XM='],
  // base64url Encoded + padding
  ['p4$$w0rd', 'Hello World!', 'U2Fs dGVk X1-p JN_n d1wl kbUI zOAP t2qJ RA4R riVj cgQ='],
  // missing padding
  ['p4$$w0rd', 'Hello World!', 'U2FsdGVkX18TCRov0Bv3QfACP7UBFxSNbvnYovj8cPY'],
  // extra padding
  ['p4$$w0rd', 'Hello World!', 'U2FsdGVkX19eKUhE/+SYqTO5Z/zzP6pvJGKBo14UI64=========='],
  // url + base64url Encoded
  ['p4$$w0rd', 'Hello World!', 'http://foo.com/#/decode/U2FsdGVkX18sSRmSGaQgnduw7ubg5Lg9whW1UvoK_mc='],
];
