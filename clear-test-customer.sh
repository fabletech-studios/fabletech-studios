#!/bin/bash

# Script to clear test customer data for fresh testing
# Usage: ./clear-test-customer.sh <email>

EMAIL="$1"

if [ -z "$EMAIL" ]; then
  echo "Usage: ./clear-test-customer.sh <email>"
  echo "Example: ./clear-test-customer.sh test@example.com"
  exit 1
fi

echo "⚠️  WARNING: This will delete all customer data for: $EMAIL"
echo "This should only be used for test accounts!"
read -p "Are you sure? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled"
  exit 1
fi

echo "🔍 Finding customer records for: $EMAIL"

# Use curl to call our admin endpoint
curl -X POST http://localhost:3000/api/admin/delete-test-customer \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\"}" \
  | jq .

echo "✅ Done"