#!/bin/bash

IPHONE_UDID="9ADB501C-5815-4F40-BB34-FDA1C6D92D91"
ROOT=$(cd "$(dirname "$0")" && pwd)

echo "🚀 Booting iPhone simulator..."
xcrun simctl boot "$IPHONE_UDID" 2>/dev/null || true
open -a Simulator

echo "🔧 Starting backend..."
cd "$ROOT/backend" && npm run start:dev &
BACKEND_PID=$!

echo "📱 Starting Expo on iPhone (UDID: $IPHONE_UDID)..."
cd "$ROOT/frontend" && yarn start

# When expo exits, kill the backend too
kill $BACKEND_PID 2>/dev/null
