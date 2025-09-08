const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if sharp is available, if not install it
try {
  require('sharp');
} catch (error) {
  console.log('Installing sharp for image processing...');
  execSync('npm install sharp', { stdio: 'inherit' });
}

const sharp = require('sharp');

const sourceImage = path.join(__dirname, '../src/assets/images/dots_logo.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');
const iosPath = path.join(__dirname, '../ios/dots_corporate/Images.xcassets/AppIcon.appiconset');

// Configuration options
const config = {
  appIconPadding: 0.2, // 20% padding for app icons (0.2 = 20%)
  notificationIconPadding: 0.15, // 15% padding for notification icons
  backgroundColor: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
  // backgroundColor: { r: 255, g: 255, b: 255, alpha: 1 }, // White background (uncomment if needed)
};

// Android icon sizes
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// iOS icon sizes
const iosSizes = [
  { size: 20, scale: 2, filename: 'Icon-App-20x20@2x.png' },
  { size: 20, scale: 3, filename: 'Icon-App-20x20@3x.png' },
  { size: 29, scale: 2, filename: 'Icon-App-29x29@2x.png' },
  { size: 29, scale: 3, filename: 'Icon-App-29x29@3x.png' },
  { size: 40, scale: 2, filename: 'Icon-App-40x40@2x.png' },
  { size: 40, scale: 3, filename: 'Icon-App-40x40@3x.png' },
  { size: 60, scale: 2, filename: 'Icon-App-60x60@2x.png' },
  { size: 60, scale: 3, filename: 'Icon-App-60x60@3x.png' },
  { size: 1024, scale: 1, filename: 'Icon-App-1024x1024@1x.png' }
];

// Notification icon sizes
const notificationSizes = {
  'drawable-mdpi': 24,
  'drawable-hdpi': 36,
  'drawable-xhdpi': 48,
  'drawable-xxhdpi': 72,
  'drawable-xxxhdpi': 96
};

async function generateIconWithPadding(sourceImage, outputPath, size, paddingRatio = 0.2) {
  // Calculate logo size with padding
  const logoSize = Math.floor(size * (1 - paddingRatio));
  
  // Get source image dimensions to maintain aspect ratio
  const sourceInfo = await sharp(sourceImage).metadata();
  const aspectRatio = sourceInfo.width / sourceInfo.height;
  
  let finalLogoWidth, finalLogoHeight;
  if (aspectRatio > 1) {
    // Landscape: width is limiting factor
    finalLogoWidth = logoSize;
    finalLogoHeight = Math.floor(logoSize / aspectRatio);
  } else {
    // Portrait or square: height is limiting factor
    finalLogoHeight = logoSize;
    finalLogoWidth = Math.floor(logoSize * aspectRatio);
  }
  
  // Calculate center position
  const left = Math.floor((size - finalLogoWidth) / 2);
  const top = Math.floor((size - finalLogoHeight) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: config.backgroundColor
    }
  })
  .composite([{
    input: await sharp(sourceImage)
      .resize(finalLogoWidth, finalLogoHeight, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .png()
      .toBuffer(),
    left: left,
    top: top
  }])
  .png()
  .toFile(outputPath);

  return { logoSize: Math.max(finalLogoWidth, finalLogoHeight), padding: Math.min(left, top), left, top };
}

async function generateIcons() {
  try {
    console.log('🎨 Generating app icons with padding from dots_logo.png...');
    console.log(`📐 App icon padding: ${config.appIconPadding * 100}%`);
    console.log(`📐 Notification icon padding: ${config.notificationIconPadding * 100}%`);
    
    // Check if source image exists
    if (!fs.existsSync(sourceImage)) {
      throw new Error(`Source image not found: ${sourceImage}`);
    }

    // Get source image info
    const sourceInfo = await sharp(sourceImage).metadata();
    console.log(`📏 Source image: ${sourceInfo.width}x${sourceInfo.height}`);

    // Generate Android app icons
    console.log('📱 Generating Android app icons...');
    for (const [folder, size] of Object.entries(androidSizes)) {
      const folderPath = path.join(androidResPath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const { padding, left, top } = await generateIconWithPadding(
        sourceImage, 
        path.join(folderPath, 'ic_launcher.png'), 
        size, 
        config.appIconPadding
      );

      await generateIconWithPadding(
        sourceImage, 
        path.join(folderPath, 'ic_launcher_round.png'), 
        size, 
        config.appIconPadding
      );

      console.log(`✅ Generated ${folder}/ic_launcher.png (${size}x${size}) centered at (${left},${top})`);
    }

    // Generate iOS app icons
    console.log('🍎 Generating iOS app icons...');
    for (const icon of iosSizes) {
      const actualSize = icon.size * icon.scale;
      const outputPath = path.join(iosPath, icon.filename);
      
      const { padding, left, top } = await generateIconWithPadding(
        sourceImage, 
        outputPath, 
        actualSize, 
        config.appIconPadding
      );

      console.log(`✅ Generated ${icon.filename} (${actualSize}x${actualSize}) centered at (${left},${top})`);
    }

    // Generate Android notification icons
    console.log('🔔 Generating Android notification icons...');
    for (const [folder, size] of Object.entries(notificationSizes)) {
      const folderPath = path.join(__dirname, '../android/app/src/main/res', folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const { padding, left, top } = await generateIconWithPadding(
        sourceImage, 
        path.join(folderPath, 'ic_notification.png'), 
        size, 
        config.notificationIconPadding
      );

      // Generate small notification icon
      const smallSize = Math.max(24, size);
      await generateIconWithPadding(
        sourceImage, 
        path.join(folderPath, 'ic_notification_small.png'), 
        smallSize, 
        config.notificationIconPadding
      );

      console.log(`✅ Generated ${folder}/ic_notification.png (${size}x${size}) centered at (${left},${top})`);
    }

    // Update iOS Contents.json
    console.log('📝 Updating iOS Contents.json...');
    const contentsJson = {
      "images": iosSizes.map(icon => ({
        "idiom": icon.size === 1024 ? "ios-marketing" : "iphone",
        "scale": `${icon.scale}x`,
        "size": `${icon.size}x${icon.size}`,
        "filename": icon.filename
      })),
      "info": {
        "author": "xcode",
        "version": 1
      }
    };

    fs.writeFileSync(
      path.join(iosPath, 'Contents.json'),
      JSON.stringify(contentsJson, null, 2)
    );

    console.log('🎉 All icons generated successfully with padding!');
    console.log('\n📋 Next steps:');
    console.log('1. Clean and rebuild your app');
    console.log('2. For Android: npx react-native run-android');
    console.log('3. For iOS: npx react-native run-ios');
    console.log('4. Uninstall and reinstall the app to see new icons');
    console.log('\n💡 Tips:');
    console.log('- If icons still look cropped, increase padding in config');
    console.log('- If icons look too small, decrease padding in config');
    console.log('- Edit config.backgroundColor for different background colors');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
