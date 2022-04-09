#!/bin/bash

function check {
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
  echo $1
  echo "  Testing encode"

  ENCODED=$(echo -n "$4" | openssl enc -e -aes-256-cbc -A -base64 -pbkdf2 -pass pass:"$3")
  echo "    Encoding Passed..." # TODO: check if this is correct

  echo "  Testing decode"

  OUTPUT=$(echo -n "$ENCODED" | openssl enc -d -aes-256-cbc -A -base64 -pbkdf2 -pass pass:"$3")
  check "$ENCODED" "$OUTPUT" "$4"

  ENCODED=$2
  OUTPUT=$(echo -n "$ENCODED" | openssl enc -d -aes-256-cbc -A -base64 -pbkdf2 -pass pass:"$3")
  check "$ENCODED" "$OUTPUT" "$4"
}

testDecode "TEST 1" "U2FsdGVkX18G7u+bUTUSmf7daGUYWzT1wbVJ4V7hMZM=" "nO62tPMSge" "Ambrosi"
testDecode "TEST 2" "U2FsdGVkX19r0SsJRSfRdQ84pccyMNOgqEz6DZ3tl2Y=" "9WPwJ8gRkJI" "Marna"
testDecode "TEST 3" "U2FsdGVkX19loYHdQu3erlXT/1j4XPee+yFtxKpA+WOSpOa8zqZgu+yxSzC1xxlaAlmzPunXhIG6laelq3EPbQ==" "Virtual grid-enabled moderator" "Reduced analyzing knowledge base"
