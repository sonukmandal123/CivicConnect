@echo off
set "PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%PATH%"
echo ========================================================
echo Starting CivicConnect Backend (Port 5000) ^& Frontend (Port 5173)...
echo ========================================================
start "CivicConnect Server" cmd /k "set PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%%PATH%% && cd /d "%~dp0server" && npm run dev"
start "CivicConnect Client" cmd /k "set PATH=C:\Program Files\nodejs;C:\Program Files\Git\cmd;%%PATH%% && cd /d "%~dp0client" && npm run dev"
echo Both servers launched in separate windows!
