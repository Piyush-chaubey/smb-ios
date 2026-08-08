# Android Build & Deployment Instructions

## Fixed Issues for Android 15 🔧

### 1. Network Security Configuration

- ✅ Added trusted domains: `anandvrindavan.com`, `digitaloceanspaces.com`, Facebook CDNs
- ✅ Configured SSL certificate trust for HTTPS connections
- ✅ Enabled cleartext traffic for localhost (development only)

### 2. Audio Playback

- ✅ Removed `crossOrigin` attribute on native (causes issues on Android WebView)
- ✅ Added detailed MediaError handling with user-friendly messages
- ✅ Improved timeout handling and retry logic
- ✅ Better native platform detection using Capacitor API
- ✅ Extended HTTP timeouts for slower connections (60s read, 30s connect)

### 3. Image Loading (Thumbnails)

- ✅ Added proper fetch headers with `Accept: image/*`
- ✅ Added `referrerpolicy="no-referrer"` to prevent CORS issues
- ✅ Improved error handling with graceful fallbacks
- ✅ Better filesystem caching for native platforms
- ✅ Fallback to remote URLs when local caching fails

### 4. API Requests

- ✅ Improved CapacitorHttp configuration for native platforms
- ✅ Added User-Agent header for better server compatibility
- ✅ Better error logging with status codes
- ✅ Separate handling for web vs native platforms

## Build Commands 📦

### Quick Method (Recommended) 🚀

Double-click one of these batch files:

- **`quick-build.bat`** - Build and sync (doesn't open Android Studio)
- **`build-android.bat`** - Build, sync, and open Android Studio

### Manual Method

#### Step 1: Build the Web App

```bash
npm run build
```

#### Step 2: Sync with Capacitor (Copy web assets to Android)

```bash
npx cap sync android
```

#### Step 3: Open Android Studio

```bash
npx cap open android
```

### Step 4: Build APK in Android Studio

1. In Android Studio, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for the build to complete
3. APK location will be shown in notification (usually `android/app/build/outputs/apk/debug/app-debug.apk`)

### Alternative: Build from Command Line

```bash
cd android
./gradlew assembleDebug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### For Release Build (Production)

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Testing on Device 📱

### Install APK via USB

```bash
# Enable USB Debugging on your Android device first
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Run directly on device

```bash
npx cap run android
```

## Environment Configuration 🔐

Make sure `.env.mobile` is properly configured:

```env
VITE_BASE_SERVER_URL=https://anandvrindavan.com/api
VITE_FB_TOKEN=your_facebook_token_here
```

## Debugging on Android 🐛

### View Logs in Real-Time

```bash
# View all app logs
adb logcat | grep -i "chromium\|capacitor\|console"

# View only errors
adb logcat *:E
```

### Chrome DevTools

1. Connect device via USB
2. Open Chrome on desktop
3. Navigate to `chrome://inspect/#devices`
4. Find your app and click "inspect"

## Common Issues & Solutions ❓

### Issue: "net::ERR_CLEARTEXT_NOT_PERMITTED"

**Solution:** Already fixed in `network_security_config.xml` - make sure you rebuild after changes

### Issue: Audio won't play

**Solution:**

- Check internet connection
- Verify audio URLs are accessible
- Check logcat for specific error codes
- Try the retry button in the player

### Issue: Red X on thumbnails

**Solution:**

- Images now fallback gracefully to placeholder icons
- Check if image URLs are accessible from device
- Verify network security config includes image CDN domains

### Issue: "Failed to load audio"

**Solution:**

- App now shows specific error messages (Network error, Format error, etc.)
- Use the retry button
- Check if Digital Ocean Spaces URLs are accessible

## Performance Tips ⚡

1. **First Load:** First 3 tracks are prioritized for faster initial experience
2. **Background Loading:** Remaining tracks load in background without blocking UI
3. **Caching:** Thumbnails are cached locally on device for faster subsequent loads
4. **Network:** Extended timeouts account for slower mobile connections

## Security Notes 🔒

- All production domains use HTTPS with proper SSL verification
- User certificates are trusted for enterprise/testing scenarios
- Cleartext traffic only allowed for localhost (dev mode)
- Network security config enforces secure connections

## Build Checklist ✅

Before deploying to production:

- [ ] Update version number in `android/app/build.gradle`
- [ ] Verify `.env.mobile` has production API URLs
- [ ] Test on multiple Android versions (minimum API 22, recommended 15+)
- [ ] Test on slow network connections
- [ ] Test audio playback with different file formats
- [ ] Verify all images load correctly
- [ ] Test offline behavior
- [ ] Enable ProGuard for release builds (if needed)

## Version Info 📋

- **Minimum Android SDK:** 22 (Android 5.1)
- **Target Android SDK:** 34 (Android 14)
- **Tested on:** Android 15
- **Build Type:** Debug/Release
- **Capacitor Version:** Check `package.json`

---

**Last Updated:** After fixing Android 15 playback and image loading issues
