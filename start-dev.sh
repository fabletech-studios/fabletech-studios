#!/bin/bash

echo "Starting FableTech Studios development server..."
echo "Port: ${PORT:-3001}"
echo "========================================"

# Kill any existing processes
lsof -ti:${PORT:-3001} | xargs kill -9 2>/dev/null || true

# Start with error handling
PORT=${PORT:-3001} npm run dev 2>&1 | while IFS= read -r line; do
    echo "[$(date '+%H:%M:%S')] $line"
    
    # Check for common errors
    if [[ $line == *"EADDRINUSE"* ]]; then
        echo "ERROR: Port is already in use!"
        exit 1
    fi
    
    if [[ $line == *"Module not found"* ]]; then
        echo "ERROR: Missing module detected!"
    fi
done