@echo off
echo Starting Backend Server...
start "Backend" cmd /c "cd backend && go run main.go"

echo Starting Frontend Development Server...
start "Frontend" cmd /c "cd frontend && npm run dev"
echo Both servers are starting in separate windows.
