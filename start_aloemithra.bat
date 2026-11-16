@echo off
title Starting AloeMithra...
echo ============================================================
echo           Launching AloeMithra Web Platform...
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting AloeMithra AI Backend (Port 5000)...
start "AloeMithra Backend (Port 5000)" cmd /c "python api/app.py"

echo [2/3] Starting AloeMithra React Frontend (Port 5173)...
start "AloeMithra Frontend (Port 5173)" cmd /c "cd frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo ============================================================
echo      AloeMithra is live! Opening browser...
echo      URL: http://localhost:5173
echo ============================================================
start http://localhost:5173

exit

