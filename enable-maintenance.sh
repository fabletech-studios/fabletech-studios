#!/bin/bash

echo "🔧 Enabling maintenance mode..."

# Backup current middleware if it exists
if [ -f "middleware.ts" ]; then
  mv middleware.ts middleware-backup.ts
  echo "✓ Backed up existing middleware"
fi

# Enable maintenance middleware
cp middleware-maintenance.ts middleware.ts
echo "✓ Maintenance mode enabled"

echo "
🌙 Site is now in maintenance mode!

To disable maintenance mode later, run:
./disable-maintenance.sh

Sleep well! 😴
"