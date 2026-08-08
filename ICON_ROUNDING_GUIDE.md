# iOS-Style Icon Rounding Guide 🎨

## Overview

This guide helps you create iOS-style rounded icons with soft edges (22.5% border radius) for your app.

## iOS Icon Specifications

- **Border Radius**: 22.5% of icon size (e.g., 115px for 512px icon)
- **Smooth Curves**: Quadratic bezier curves for smooth corners
- **Sizes Needed**:
  - 512x512 - High resolution
  - 192x192 - PWA standard
  - 180x180 - iOS
  - 1024x1024 - App Store

---

## Method 1: Browser-Based Tool (Easiest) 🌐

### Step 1: Open the Tool

1. Double-click `icon-rounder.html` in the project folder
2. Or open it in any web browser

### Step 2: Process Your Icon

1. Click **"Select Image"**
2. Choose your `public/favicon.png`
3. Preview the rounded version
4. Click **"Download Rounded Icon"**

### Step 3: Replace the Icon

1. Save the downloaded file as `favicon-rounded.png`
2. Delete old `public/favicon.png`
3. Rename `favicon-rounded.png` to `favicon.png`

---

## Method 2: Python Script (Automated) 🐍

### Requirements

```bash
pip install Pillow
```

### Run the Script

```bash
python round-icon.py
```

### Output

- Creates `public/favicon-rounded.png`
- Review it, then replace `favicon.png` if you like it

---

## Method 3: Online Tools 🌍

### Recommended Sites:

1. **AppIcon.co** - https://appicon.co/
   - Upload your icon
   - Select iOS style
   - Download all sizes

2. **MakeAppIcon** - https://makeappicon.com/
   - Upload square PNG
   - Generates all platform icons

3. **Icon Kitchen** - https://icon.kitchen/
   - Google's official tool
   - Generates Android adaptive icons too

---

## Method 4: Figma/Photoshop (Manual) 🎨

### Figma:

1. Create 512x512 frame
2. Place your image
3. Add rectangle with 115px corner radius
4. Use as mask
5. Export as PNG

### Photoshop:

1. Open your icon (512x512)
2. Select rounded rectangle tool
3. Set radius to 115px (22.5% of 512)
4. Create selection
5. Invert selection → Delete outside
6. Save as PNG

---

## Applying to Your App

### Update Web App (PWA)

1. Replace `public/favicon.png` with rounded version
2. Update `public/manifest.webmanifest`:
   ```json
   {
     "icons": [
       {
         "src": "favicon.png",
         "sizes": "512x512",
         "type": "image/png",
         "purpose": "any maskable"
       }
     ]
   }
   ```

### Update Android Icons

Android icons are in `android/app/src/main/res/`:

```
mipmap-mdpi/ic_launcher.png         (48x48)
mipmap-hdpi/ic_launcher.png         (72x72)
mipmap-xhdpi/ic_launcher.png        (96x96)
mipmap-xxhdpi/ic_launcher.png       (144x144)
mipmap-xxxhdpi/ic_launcher.png      (192x192)
```

#### Quick Update:

1. Use **AppIcon.co** or **Image Asset Studio** in Android Studio
2. Upload your rounded 512x512 icon
3. Generate all sizes
4. Replace in `mipmap-*` folders

### Update iOS Icons (if you add iOS support later)

iOS icons go in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

---

## Testing Your Icon 📱

### Web Browser:

1. Build: `npm run build`
2. Open `dist/index.html` in browser
3. Check browser tab icon

### Android Device:

1. Build: `npm run build && npx cap sync android`
2. Install APK on device
3. Check home screen icon
4. Check app switcher icon

---

## Size Reference Table 📏

| Platform        | Size      | Radius | Usage         |
| --------------- | --------- | ------ | ------------- |
| Web (PWA)       | 512x512   | 115px  | High-res icon |
| Web (PWA)       | 192x192   | 43px   | Standard icon |
| Android XXXHDPI | 192x192   | 43px   | Launcher icon |
| Android XXHDPI  | 144x144   | 32px   | Launcher icon |
| Android XHDPI   | 96x96     | 22px   | Launcher icon |
| Android HDPI    | 72x72     | 16px   | Launcher icon |
| Android MDPI    | 48x48     | 11px   | Launcher icon |
| iOS             | 180x180   | 41px   | App icon      |
| iOS             | 1024x1024 | 230px  | App Store     |

**Formula**: Radius = Size × 0.225 (22.5%)

---

## Common Icon Formats 🖼️

### Square Icon (Current)

- Sharp corners
- Modern/minimalist
- Works everywhere

### Rounded Icon (iOS Style)

- Soft corners (22.5% radius)
- Premium feel
- Matches iOS design language
- **Recommended for app stores**

### Adaptive Icon (Android)

- Foreground + Background layers
- System applies shape
- **Required for Android 8+**

---

## Best Practices ✨

1. **Start with square**: Design your icon in a square canvas
2. **Safe zone**: Keep important content in central 80%
3. **High resolution**: Start with 1024x1024 or larger
4. **Simple design**: Icons should be recognizable at small sizes
5. **Contrast**: Ensure good contrast for visibility
6. **Test on device**: Always test on real devices
7. **Brand consistency**: Match your app's visual identity

---

## Automation Script 🤖

Want to generate all sizes automatically? Run:

```bash
# Install sharp (image processing)
npm install sharp

# Create generate-icons.js
node generate-icons.js
```

Create `generate-icons.js`:

```javascript
import fs from 'fs'
import sharp from 'sharp'

const sizes = [48, 72, 96, 144, 192, 512]
const inputIcon = 'public/favicon.png'

async function generateIcons() {
  for (const size of sizes) {
    await sharp(inputIcon).resize(size, size).toFile(`public/icon-${size}.png`)
    console.log(`✅ Generated ${size}x${size}`)
  }
}

generateIcons()
```

---

## Troubleshooting 🔧

### Issue: Icon looks pixelated

**Solution**: Start with higher resolution source (1024x1024+)

### Issue: Corners too sharp/soft

**Solution**: Adjust radius:

- iOS: 22.5%
- Material Design: 25%
- Custom: 15-30%

### Issue: Icon doesn't update after rebuild

**Solution**:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Uninstall app from device
3. Rebuild: `npm run build && npx cap sync android`
4. Reinstall APK

### Issue: Different sizes have different radiuses

**Solution**: Use proportional radius (22.5% of size) for consistency

---

## Files in This Guide 📂

- `icon-rounder.html` - Browser-based tool (no installation needed)
- `round-icon.py` - Python script (requires Pillow)
- `round-icon.js` - Node.js script (generates HTML tool)
- `ICON_ROUNDING_GUIDE.md` - This guide

---

## Quick Start ⚡

**Fastest method:**

1. Double-click `icon-rounder.html`
2. Upload your `public/favicon.png`
3. Download rounded version
4. Replace original
5. Build: `npm run build && npx cap sync android`

**Done!** 🎉

---

## Resources 🔗

- **iOS Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/app-icons
- **Material Design Icons**: https://material.io/design/iconography/product-icons.html
- **PWA Icon Guide**: https://web.dev/add-manifest/#icons
- **AppIcon Generator**: https://appicon.co/
- **Icon Kitchen**: https://icon.kitchen/

---

**Need help?** Check the generated `icon-rounder.html` - it has a visual preview!
