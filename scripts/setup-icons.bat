@echo off
echo 🎨 Setting up Dots Corporate App Icons
echo ======================================

REM Check if dots_logo.png exists
if not exist "..\src\assets\images\dots_logo.png" (
    echo ❌ Error: dots_logo.png not found in src\assets\images\
    echo Please make sure the logo file exists before running this script.
    pause
    exit /b 1
)

echo ✅ Found dots_logo.png

REM Generate all icons
echo 📱 Generating app icons...
call npm run generate-all-icons --prefix ..

if %errorlevel% neq 0 (
    echo ❌ Error generating icons
    pause
    exit /b 1
)

echo ✅ Icons generated successfully!

REM Clean and rebuild
echo 🧹 Cleaning project...
call npm run clean --prefix ..

echo 🔨 Rebuilding project...
echo Choose platform:
echo 1) Android
echo 2) iOS
echo 3) Both
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo 📱 Building Android...
    call npx react-native run-android --prefix ..
) else if "%choice%"=="2" (
    echo 🍎 Building iOS...
    call npx react-native run-ios --prefix ..
) else if "%choice%"=="3" (
    echo 📱 Building Android...
    call npx react-native run-android --prefix ..
    echo 🍎 Building iOS...
    call npx react-native run-ios --prefix ..
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo 🎉 Icon setup completed!
echo.
echo 📋 Next steps:
echo 1. Uninstall the app from your device/emulator
echo 2. Reinstall the app to see the new icons
echo 3. Check both app icon and notification icons
echo.
echo 🔍 To verify:
echo - App icon should show dots_logo.png
echo - Notification icons should show dots_logo.png
echo - All icons should be crisp and clear
pause
