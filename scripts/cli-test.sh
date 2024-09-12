#!/bin/bash

CMD="openssl enc"
OPTS="-aes-256-cbc -pbkdf2 -md sha256 -iter 10000"

function check_encode {
  if [[ "$2" =~ ^$3.* ]]
  then
    echo "    Encoding Passed..."
  else
    echo "    Encoding Failed..."
    echo "      Failed to encode: $1"
    echo "      Expected: $2"
    echo "      Actual: $3"
  fi
}

function check_decode {
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

  ENCODED=$(echo -n "$4" | $CMD -e -A -base64 $OPTS -pass pass:"$3")
  check_encode "$4" "$ENCODED" "U2FsdGVkX"

  ENCODED_SPACE=$(echo -n "$4" | $CMD -e -A -base64 $OPTS -pass pass:"$3" | sed 's/.\{4\}/& /g' )
  check_encode "$4" "$ENCODED_SAFE" "U2Fs dGVk X"

  ENCODED_SAFE=$(echo -n "$4" | $CMD -e $OPTS -pass pass:"$3" | basenc --base64url | sed 's/.\{4\}/& /g' )
  check_encode "$4" "$ENCODED_SAFE" "U2Fs dGVk X"

  echo "  Testing decode"

  OUTPUT=$(echo -n "$ENCODED" | $CMD -d -A -base64 $OPTS -pass pass:"$3")
  check_decode "$ENCODED" "$OUTPUT" "$4"

  OUTPUT=$(echo -n "$ENCODED_SAFE" | basenc -di --base64url | $CMD -d $OPTS -pass pass:"$3")
  check_decode "$ENCODED" "$OUTPUT" "$4"

  OUTPUT=$(echo -n "$ENCODED_SPACE" | basenc -di --base64 | $CMD -d $OPTS -pass pass:"$3")
  check_decode "$ENCODED" "$OUTPUT" "$4"

  OUTPUT=$(echo -n "$2" | basenc -di --base64 | $CMD -d $OPTS -pass pass:"$3")
  check_decode "$2" "$OUTPUT" "$4"
}

testDecode "TEST 1" "U2FsdGVkX18G7u+bUTUSmf7daGUYWzT1wbVJ4V7hMZM=" "nO62tPMSge" "Ambrosi"
testDecode "TEST 2" "U2FsdGVkX19r0SsJRSfRdQ84pccyMNOgqEz6DZ3tl2Y=" "9WPwJ8gRkJI" "Marna"
testDecode "TEST 3" "U2FsdGVkX19loYHdQu3erlXT/1j4XPee+yFtxKpA+WOSpOa8zqZgu+yxSzC1xxlaAlmzPunXhIG6laelq3EPbQ==" "Virtual grid-enabled moderator" "Reduced analyzing knowledge base"
testDecode "TEST 4" "U2Fs dGVk X1/K f8Yo 6JjB h+qE LWhi rAXr 78+b bPQj lxE=" "p4\$\$w0rd" "Hello World!"
