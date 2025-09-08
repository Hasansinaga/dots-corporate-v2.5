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

async function generateIcons() {
  try {
    console.log('🎨 Generating app icons from dots_logo.png...');
    
    // Check if source image exists
    if (!fs.existsSync(sourceImage)) {
      throw new Error(`Source image not found: ${sourceImage}`);
    }

    // Get source image info
    const sourceInfo = await sharp(sourceImage).metadata();
    console.log(`📏 Source image: ${sourceInfo.width}x${sourceInfo.height}`);

    // Generate Android icons
    console.log('📱 Generating Android icons...');
    for (const [folder, size] of Object.entries(androidSizes)) {
      const folderPath = path.join(androidResPath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Calculate padding to fit the logo properly (80% of icon size)
      const logoSize = Math.floor(size * 0.8);
      
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

      // Generate ic_launcher.png with padding
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
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
      .toFile(path.join(folderPath, 'ic_launcher.png'));

      // Generate ic_launcher_round.png (same as ic_launcher for now)
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
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
      .toFile(path.join(folderPath, 'ic_launcher_round.png'));

      console.log(`✅ Generated ${folder}/ic_launcher.png (${size}x${size}) centered at (${left},${top})`);
    }

    // Generate iOS icons
    console.log('🍎 Generating iOS icons...');
    for (const icon of iosSizes) {
      const actualSize = icon.size * icon.scale;
      const outputPath = path.join(iosPath, icon.filename);
      
      // Calculate padding to fit the logo properly (80% of icon size)
      const logoSize = Math.floor(actualSize * 0.8);
      
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
      const left = Math.floor((actualSize - finalLogoWidth) / 2);
      const top = Math.floor((actualSize - finalLogoHeight) / 2);

      // Generate iOS icon with padding
      await sharp({
        create: {
          width: actualSize,
          height: actualSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
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

      console.log(`✅ Generated ${icon.filename} (${actualSize}x${actualSize}) centered at (${left},${top})`);
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

    console.log('🎉 All icons generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Clean and rebuild your app');
    console.log('2. For Android: npx react-native run-android');
    console.log('3. For iOS: npx react-native run-ios');
    console.log('4. Uninstall and reinstall the app to see new icons');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
