#!/usr/bin/env bash

mkdir -p build-contract
./bundle.sh ./contracts/DANSToken.sol > DANSToken-bundled.sol
solcjs --optimize --bin -o build-contract DANSToken-bundled.sol
solcjs --optimize --abi -o build-contract DANSToken-bundled.sol
