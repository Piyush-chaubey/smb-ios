# Android USB Debugging - Troubleshooting Guide

## ✅ Fixes Applied

### 1. **Android Permissions Added**

- `android.permission.MODIFY_AUDIO_SETTINGS` - Required for audio playback
- `android.permission.READ_EXTERNAL_STORAGE` - For accessing files
- `android.permission.WRITE_EXTERNAL_STORAGE` - For caching

### 2. **Network Security Configuration**

- Created `network_security_config.xml` for secure HTTPS connections
- Allows connections to Facebook Graph API and your backend
- Configured in AndroidManifest.xml

### 3. **Enhanced Audio Playback (audioStore.ts)**

- Added detailed logging with emojis for easy debugging
- Fallback mechanism: Native → Web audio if native fails
- Better error handling and recovery
- Timeouts and retry logic for network requests

### 4. **Enhanced API Requests (api.ts)**

- Added 30-second timeout for all API requests
- Better error messages with logging
- Fallback fetch for development mode
- Proper console logging for debugging

### 5. **Daily Darshan Improvements (DailyDarshan.vue)**

- Added detailed logging at each step
- Better error handling and reporting
- Step-by-step progress tracking

---

## 📱 Testing Steps in Android Studio

### Step 1: Rebuild and Deploy

```bash
cd c:\Users\Piyush\app-avd

# Clean and rebuild
npm run build

# In Android Studio:
# 1. Menu: Build → Clean Project
# 2. Menu: Build → Rebuild Project
# 3. Run → Run 'app'
```

### Step 2: View Logcat in Android Studio

1. Open Logcat: View → Tool Windows → Logcat
2. Filter by tag: Type in the top filter box
3. Look for these emoji logs:
   - `🎵` - Audio logs
   - `📸` - Daily Darshan logs
   - `❌` - Error logs
   - `✅` - Success logs

### Step 3: Test Audio Playback

1. Go to **Bhajan** tab
2. Click on any song
3. In Logcat, you should see:
   ```
   🎵 Playing song: [Song Name] Platform: android
   📱 Loading native audio: id_[ID] URL: [URL]
   ✅ Native audio preloaded
   ▶️ Native audio playing
   ⏱️ Audio duration: [seconds]
   ```

### Step 4: Test Daily Darshan

1. Go to **Darshan** tab
2. Pull to refresh or wait for auto-load
3. In Logcat, you should see:
   ```
   📸 Fetching daily darshan posts...
   ✅ Received X posts from API
   ✅ Filtered to Y images (excluding videos)
   ✅ Processed Y posts successfully
   ```

---

## 🔧 Common Issues & Solutions

### Issue 1: Audio Not Playing

**Symptoms:** Play button doesn't work, no error in logcat

**Solutions:**

1. Check URL is accessible: Copy the song URL in browser
2. Check network: Device must be on same WiFi as laptop
3. Check permissions: Settings → Apps → [App] → Permissions → Audio
4. Restart app: Swipe away and reopen

**Logcat to check:**

```
Look for: 🎵 Playing song
If missing: App isn't reaching audio control
Look for: ❌ Native audio error
If present: Check error message
```

### Issue 2: Daily Darshan Not Loading

**Symptoms:** "Loading..." spinner continues forever

**Solutions:**

1. Check Facebook token in `.env` file
2. Check network connectivity
3. Press back and return to tab
4. Force refresh (pull-to-refresh)

**Logcat to check:**

```
Look for: 📸 Fetching daily darshan
If missing: Component not loading
Look for: ❌ DailyDarshan API Error
Check error details in brackets
```

### Issue 3: Slow Load Times

**Solutions:**

1. Check device RAM usage (Settings → Apps)
2. Close other apps
3. Ensure USB debugging is enabled
4. Use fast WiFi (not mobile hotspot)

---

## 🐛 Debugging Checklist

- [ ] Device is connected via USB with debugging enabled
- [ ] `adb devices` shows your device (run in terminal)
- [ ] App has all required permissions
- [ ] Network is working (can browse web)
- [ ] Logcat is open and showing real-time logs
- [ ] Console shows no TypeScript/Vue errors
- [ ] `.env` file has valid `VITE_BASE_SERVER_URL` and `VITE_FB_TOKEN`

---

## 📲 Advanced Debugging

### Enable USB Debugging on Android

1. Settings → About Phone → Tap Build Number 7 times
2. Settings → Developer Options → USB Debugging (toggle ON)
3. When prompted on device: Tap "Allow"

### View actual URL being called

In Logcat, search for:

```
🎵 Fetching audio from:
📸 Fetching daily darshan
```

Copy the URL and test in browser to verify it's accessible

### Check Response Headers

In Chrome DevTools (USB debugging):

1. Plug phone to laptop
2. Chrome: `chrome://inspect`
3. Select your device
4. Go to Network tab
5. Trigger audio/darshan load
6. Check network requests

---

## 💾 If Issues Persist

### Create a Bug Report with:

1. **Logcat output** (copy paste relevant logs)
2. **Device info**: Android version, device model
3. **Network**: WiFi or 4G?
4. **Steps to reproduce**: Exact steps that fail
5. **Expected vs Actual**: What should happen vs what does

---

## 🚀 Performance Tips

1. **For Video**: Make sure device has enough RAM (>2GB free)
2. **For Audio**: Use HTTPS URLs only (secure)
3. **For Images**: Ensure files are <2MB each
4. **Network**: Test on same WiFi as backend server

---

**Last Updated:** April 7, 2026
**App Version:** 1.0.0
