#!/bin/bash

echo "🎨 Setting up Dots Corporate App Icons"
echo "======================================"

# Check if dots_logo.png exists
if [ ! -f "../src/assets/images/dots_logo.png" ]; then
    echo "❌ Error: dots_logo.png not found in ../src/assets/images/"
    echo "Please make sure the logo file exists before running this script."
    exit 1
fi

echo "✅ Found dots_logo.png"

# Generate all icons
echo "📱 Generating app icons..."
npm run generate-all-icons --prefix ../

if [ $? -eq 0 ]; then
    echo "✅ Icons generated successfully!"
else
    echo "❌ Error generating icons"
    exit 1
fi

# Clean and rebuild
echo "🧹 Cleaning project..."
npm run clean --prefix ../

echo "🔨 Rebuilding project..."
echo "Choose platform:"
echo "1) Android"
echo "2) iOS"
echo "3) Both"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "📱 Building Android..."
        npx react-native run-android --prefix ../
        ;;
    2)
        echo "🍎 Building iOS..."
        npx react-native run-ios --prefix ../
        ;;
    3)
        echo "📱 Building Android..."
        npx react-native run-android --prefix ../
        echo "🍎 Building iOS..."
        npx react-native run-ios --prefix ../
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Icon setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Uninstall the app from your device/emulator"
echo "2. Reinstall the app to see the new icons"
echo "3. Check both app icon and notification icons"
echo ""
echo "🔍 To verify:"
echo "- App icon should show dots_logo.png"
echo "- Notification icons should show dots_logo.png"
echo "- All icons should be crisp and clear"
