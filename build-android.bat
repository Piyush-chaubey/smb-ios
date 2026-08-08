@echo off
echo ========================================
echo Building Android App
echo ========================================
echo.

echo [1/3] Building web app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)
echo.

echo [2/3] Syncing to Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Sync failed!
    pause
    exit /b %errorlevel%
)
echo.

echo [3/3] Opening Android Studio...
call npx cap open android
echo.

echo ========================================
echo Done! Android Studio should open now.
echo Build your APK from Android Studio:
echo Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo ========================================
pause
