#!/bin/zsh

echo "======================================"
echo "🚀 Starting Soff CRM Services..."
echo "======================================"

# Trap Ctrl+C (SIGINT) and SIGTERM to kill all background processes
trap 'echo "\n🛑 Stopping all services..."; kill $DJANGO_PID $CELERY_PID $FRONTEND_PID 2>/dev/null; exit' INT TERM

echo "1️⃣ Starting Django Server (Port 8000)..."
venv/bin/python manage.py runserver &
DJANGO_PID=$!

echo "2️⃣ Starting Celery Worker..."
venv/bin/celery -A core worker -l info &
CELERY_PID=$!

echo "3️⃣ Starting Frontend Server (Port 3000)..."
cd test-frontend && python3 -m http.server 3000 &
FRONTEND_PID=$!

echo "======================================"
echo "✅ All services are running!"
echo "🌐 CRM is available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop everything."
echo "======================================"

# Keep the script running and wait for user interruption
wait $DJANGO_PID $CELERY_PID $FRONTEND_PID
