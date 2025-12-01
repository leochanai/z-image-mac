#!/bin/bash

# Get the project root directory
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    if [ -n "$BACKEND_PID" ]; then
        echo "Killing Backend (PID $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        echo "Killing Frontend (PID $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    echo "✅ All services stopped."
    exit 0
}

# Trap Ctrl+C (SIGINT) and termination signal (SIGTERM)
trap cleanup SIGINT SIGTERM

echo "🚀 Starting Z-Image System..."

# 1. Start Backend
echo "🐍 Starting Python Backend..."
source "$PROJECT_ROOT/.venv/bin/activate"
# Add project root to PYTHONPATH explicitly to avoid import errors
export PYTHONPATH=$PROJECT_ROOT:$PYTHONPATH
python "$PROJECT_ROOT/app/server.py" &
BACKEND_PID=$!

# Check if backend started
if ps -p $BACKEND_PID > /dev/null; then
   echo "   Backend running (PID $BACKEND_PID) at http://localhost:8000"
else
   echo "❌ Backend failed to start."
   exit 1
fi

# 2. Start Frontend
echo "⚛️  Starting Next.js Frontend..."
cd "$PROJECT_ROOT/web"
npm run dev &
FRONTEND_PID=$!

# Check if frontend started
if ps -p $FRONTEND_PID > /dev/null; then
   echo "   Frontend running (PID $FRONTEND_PID) at http://localhost:3000"
else
   echo "❌ Frontend failed to start."
   kill $BACKEND_PID
   exit 1
fi

echo ""
echo "✨ System is live!"
echo "   👉 Open http://localhost:3000 to create images"
echo "   (Press Ctrl+C to stop both services)"
echo ""

# Wait for both processes to keep script running
wait
