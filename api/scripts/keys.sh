#!/bin/bash

# Generate a private key
openssl genrsa -out private.key 2048

# Generate a public key from the private key
openssl rsa -in private.key -pubout -out public.key

# Base64 encode the private key
echo "Private Key (Base64):"
base64 -i private.key

# Base64 encode the public key
echo "Public Key (Base64):"
base64 -i public.key

# Clean up (optional: delete raw key files)
# Uncomment the following lines if you don't want to keep the raw files
# rm private.key public.key