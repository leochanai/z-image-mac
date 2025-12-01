#!/bin/bash

echo "🛑 Force stopping Z-Image services..."

# Find and kill process on port 8000 (Backend)
BACKEND_PID=$(lsof -t -i:8000)
if [ -n "$BACKEND_PID" ]; then
    echo "   Killing Backend on port 8000 (PID $BACKEND_PID)..."
    kill -9 $BACKEND_PID
else
    echo "   No backend found on port 8000."
fi

# Find and kill process on port 3000 (Frontend)
FRONTEND_PID=$(lsof -t -i:3000)
if [ -n "$FRONTEND_PID" ]; then
    echo "   Killing Frontend on port 3000 (PID $FRONTEND_PID)..."
    kill -9 $FRONTEND_PID
else
    echo "   No frontend found on port 3000."
fi

echo "✅ Cleanup complete."
