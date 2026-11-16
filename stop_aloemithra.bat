@echo off
title Stopping AloeMithra...
echo Stopping AloeMithra servers on port 5000 and 5173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo AloeMithra stopped.
timeout /t 2 >nul
exit

