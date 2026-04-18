@echo off
REM Double-click this file to start Ollama, ngrok (tunnel to Ollama), and the Next.js dev server.
REM Requires: ollama and ngrok on your PATH, and npm dependencies installed (npm install).

cd /d "%~dp0"

start "Ollama — serve" cmd /k ollama serve
start "ngrok — Ollama 11434" cmd /k ngrok http 11434
start "Converis — npm run dev" /D "%~dp0" cmd /k npm run dev

exit /b 0
