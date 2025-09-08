# Icon Generation Scripts

Scripts untuk generate icon aplikasi dan notifikasi dari `dots_logo.png`.

## 🎯 Available Scripts

### Generate App Icons
```bash
npm run generate-icons
```
Generate icon aplikasi untuk Android dan iOS dari `src/assets/images/dots_logo.png`.

### Generate Notification Icons
```bash
npm run generate-notification-icons
```
Generate icon notifikasi untuk Android dari `dots_logo.png`.

### Generate All Icons
```bash
npm run generate-all-icons
```
Generate semua icon (app + notification) sekaligus.

### Generate Icons with Padding (Recommended)
```bash
npm run generate-icons-with-padding
```
Generate semua icon dengan padding yang dapat dikonfigurasi untuk mencegah icon terpotong.

## 📱 Generated Icons

### Android App Icons
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

### iOS App Icons
- `Icon-App-20x20@2x.png` (40x40)
- `Icon-App-20x20@3x.png` (60x60)
- `Icon-App-29x29@2x.png` (58x58)
- `Icon-App-29x29@3x.png` (87x87)
- `Icon-App-40x40@2x.png` (80x80)
- `Icon-App-40x40@3x.png` (120x120)
- `Icon-App-60x60@2x.png` (120x120)
- `Icon-App-60x60@3x.png` (180x180)
- `Icon-App-1024x1024@1x.png` (1024x1024)

### Android Notification Icons
- `drawable-mdpi/ic_notification.png` (24x24)
- `drawable-hdpi/ic_notification.png` (36x36)
- `drawable-xhdpi/ic_notification.png` (48x48)
- `drawable-xxhdpi/ic_notification.png` (72x72)
- `drawable-xxxhdpi/ic_notification.png` (96x96)

## 🚀 Usage Steps

1. **Generate Icons (Recommended)**
   ```bash
   npm run generate-icons-with-padding
   ```
   
   **Alternative:**
   ```bash
   npm run generate-all-icons
   ```

2. **Clean and Rebuild**
   ```bash
   npm run clean
   npx react-native run-android
   # atau
   npx react-native run-ios
   ```

3. **Uninstall and Reinstall App**
   - Uninstall aplikasi dari device/emulator
   - Reinstall untuk melihat icon baru

## 📋 Requirements

- Node.js
- npm
- `sharp` package (akan diinstall otomatis)

## 🔧 Troubleshooting

### Icon tidak berubah
1. Pastikan sudah uninstall dan reinstall aplikasi
2. Clear cache: `npm run clean`
3. Rebuild aplikasi

### Error "sharp not found"
Script akan otomatis install `sharp` package. Jika masih error:
```bash
npm install sharp
```

### Icon terlihat blur
Pastikan source image `dots_logo.png` memiliki resolusi yang cukup tinggi (minimal 1024x1024).

### Icon terpotong/cropped
Gunakan script dengan padding:
```bash
npm run generate-icons-with-padding
```

Atau edit konfigurasi padding di `scripts/generate-icons-with-padding.js`:
```javascript
const config = {
  appIconPadding: 0.2, // 20% padding (increase if still cropped)
  notificationIconPadding: 0.15, // 15% padding
};
```

## 📝 Notes

- Script akan otomatis install `sharp` jika belum ada
- Icon akan di-resize sesuai standar Android/iOS
- iOS Contents.json akan diupdate otomatis
- Semua icon menggunakan format PNG
