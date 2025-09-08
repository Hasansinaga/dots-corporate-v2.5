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
const androidDrawablePath = path.join(__dirname, '../android/app/src/main/res/drawable');

// Notification icon sizes (Android)
const notificationSizes = {
  'drawable-mdpi': 24,
  'drawable-hdpi': 36,
  'drawable-xhdpi': 48,
  'drawable-xxhdpi': 72,
  'drawable-xxxhdpi': 96
};

async function generateNotificationIcons() {
  try {
    console.log('🔔 Generating notification icons from dots_logo.png...');
    
    // Check if source image exists
    if (!fs.existsSync(sourceImage)) {
      throw new Error(`Source image not found: ${sourceImage}`);
    }

    // Get source image info
    const sourceInfo = await sharp(sourceImage).metadata();
    console.log(`📏 Source image: ${sourceInfo.width}x${sourceInfo.height}`);

    // Generate Android notification icons
    console.log('📱 Generating Android notification icons...');
    for (const [folder, size] of Object.entries(notificationSizes)) {
      const folderPath = path.join(__dirname, '../android/app/src/main/res', folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Calculate padding to fit the logo properly (85% of icon size for notifications)
      const logoSize = Math.floor(size * 0.85);
      
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

      // Generate notification icon with padding
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
      .toFile(path.join(folderPath, 'ic_notification.png'));

      // Generate small notification icon (24dp)
      const smallSize = Math.max(24, size);
      const smallLogoSize = Math.floor(smallSize * 0.85);
      
      let smallFinalLogoWidth, smallFinalLogoHeight;
      if (aspectRatio > 1) {
        // Landscape: width is limiting factor
        smallFinalLogoWidth = smallLogoSize;
        smallFinalLogoHeight = Math.floor(smallLogoSize / aspectRatio);
      } else {
        // Portrait or square: height is limiting factor
        smallFinalLogoHeight = smallLogoSize;
        smallFinalLogoWidth = Math.floor(smallLogoSize * aspectRatio);
      }
      
      // Calculate center position for small icon
      const smallLeft = Math.floor((smallSize - smallFinalLogoWidth) / 2);
      const smallTop = Math.floor((smallSize - smallFinalLogoHeight) / 2);

      await sharp({
        create: {
          width: smallSize,
          height: smallSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        }
      })
      .composite([{
        input: await sharp(sourceImage)
          .resize(smallFinalLogoWidth, smallFinalLogoHeight, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .png()
          .toBuffer(),
        left: smallLeft,
        top: smallTop
      }])
      .png()
      .toFile(path.join(folderPath, 'ic_notification_small.png'));

      console.log(`✅ Generated ${folder}/ic_notification.png (${size}x${size}) centered at (${left},${top})`);
    }

    console.log('🎉 Notification icons generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Update your notification code to use ic_notification');
    console.log('2. Clean and rebuild your app');
    console.log('3. Test notifications to see new icons');

  } catch (error) {
    console.error('❌ Error generating notification icons:', error.message);
    process.exit(1);
  }
}

generateNotificationIcons();
