#!/bin/bash

BASE64=^U2Fs*
BASE32=^KNQW*

function checkEncode {
  if [[ $3 =~ $2 ]]
  then
    echo "    Encoding Passed..."
  else
    echo "    Encoding Failed..."
    echo "      Failed to encode: $1"
    echo "      Expected: $2"
    echo "      Actual: $3"
  fi
}

function checkDecode {
  if [ "$2" = "$3" ]
  then
    echo "    Decoding Passed..."
  else
    echo "    Decoding Failed..."
    echo "      Failed to decode: $1"
    echo "      Expected: $2"
    echo "      Actual: $3"
  fi
}

function testDecode {

  if [[ $2 =~ ${BASE32} ]]
  then
    PREFIX=${BASE32}
    BASE=base32
  else
    PREFIX=${BASE64}
    BASE=base64
  fi

  echo "$1 (${BASE})"
  echo "  Testing encode"

  ENCODED=$(echo -n "$4" | openssl enc -e -aes-256-cbc -pbkdf2 -pass pass:"$3" | $BASE -iw0)
  checkEncode "$4" $PREFIX "$ENCODED"

  echo "  Testing decode"

  OUTPUT=$(echo -n "$ENCODED" | $BASE -diw0 | openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:"$3")
  checkDecode "$ENCODED" "$OUTPUT" "$4"

  OUTPUT=$(echo -n "$2" | $BASE -diw0 | openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:"$3")
  checkDecode "$2" "$OUTPUT" "$4"
}

testDecode "TEST 1" "U2FsdGVkX18G7u+bUTUSmf7daGUYWzT1wbVJ4V7hMZM=" "nO62tPMSge" "Ambrosi"
testDecode "TEST 2" "U2FsdGVkX19r0SsJRSfRdQ84pccyMNOgqEz6DZ3tl2Y=" "9WPwJ8gRkJI" "Marna"
testDecode "TEST 3" "U2FsdGVkX19loYHdQu3erlXT/1j4XPee+yFtxKpA+WOSpOa8zqZgu+yxSzC1xxlaAlmzPunXhIG6laelq3EPbQ==" "Virtual grid-enabled moderator" "Reduced analyzing knowledge base"

testDecode "TEST 3" "KNQWY5DFMRPV6BXO56NVCNISTH7N22DFDBNTJ5OBWVE6CXXBGGJQ====" "nO62tPMSge" "Ambrosi"
testDecode "TEST 4" "KNQWY5DFMRPV626RFMEUKJ6ROUHTRJOHGIYNHIFIJT5A3HPNS5TA====" "9WPwJ8gRkJI" "Marna"
testDecode "TEST 5" "KNQWY5DFMRPV6ZNBQHOUF3O6VZK5H72Y7BOPPHX3EFW4JKSA7FRZFJHGXTHKMYF35SYUWMFVY4MVUASZWM7OTV4EQG5JLJ5FVNYQ63I=" "Virtual grid-enabled moderator" "Reduced analyzing knowledge base"

testDecode "TEST 6" "U2Fs dGVk X18G 7u+b UTUS mf7d aGUY WzT1 wbVJ 4V7h MZM=" "nO62tPMSge" "Ambrosi"
testDecode "TEST 7" "KNQW Y5DF MRPV 626R FMEU KJ6R OUHT RJOH GIYN HIFI JT5A 3HPN S5TA====" "9WPwJ8gRkJI" "Marna"

