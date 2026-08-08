@echo off
echo ========================================
echo Quick Build ^& Sync (No Android Studio)
echo ========================================
echo.

echo [1/2] Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)
echo.

echo [2/2] Syncing to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Sync failed!
    pause
    exit /b %errorlevel%
)
echo.

echo ========================================
echo Done! Changes synced to Android.
echo.
echo To build APK manually:
echo   cd android
echo   gradlew assembleDebug
echo.
echo Or run: build-android.bat to open Android Studio
echo ========================================
pause
