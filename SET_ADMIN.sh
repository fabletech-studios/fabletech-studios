#!/bin/bash

echo "🔐 Setting Admin Role for FableTech Studios"
echo "=========================================="
echo ""
echo "This will give you admin privileges to manage content"
echo ""

# Default email from Firebase login
DEFAULT_EMAIL="bmwhelp.ga@gmail.com"

echo "Enter your Firebase login email (or press Enter for $DEFAULT_EMAIL):"
read USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    USER_EMAIL=$DEFAULT_EMAIL
fi

echo ""
echo "Setting admin role for: $USER_EMAIL"
echo ""

# Call the API endpoint
curl -X POST https://www.fabletech.studio/api/admin/set-role \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"secretKey\": \"set-admin-2025-fabletech\"
  }"

echo ""
echo ""
echo "⚠️  IMPORTANT: After running this:"
echo "1. Sign out of FableTech Studios"
echo "2. Sign back in"
echo "3. Your admin privileges will be active"
echo ""
echo "Note: Keep the Firestore rules as they are for now."
echo "Once you confirm admin access works, we can deploy the stricter rules."