#!/bin/bash

echo "🚀 Disabling maintenance mode..."

# Remove maintenance middleware
if [ -f "middleware.ts" ]; then
  rm middleware.ts
  echo "✓ Removed maintenance middleware"
fi

# Restore original middleware if it exists
if [ -f "middleware-backup.ts" ]; then
  mv middleware-backup.ts middleware.ts
  echo "✓ Restored original middleware"
fi

echo "
✨ Site is back online!

The maintenance page will still be available at /maintenance
but users won't be redirected there anymore.
"