# Build Scripts Guide 🛠️

## Available Scripts

### 1️⃣ `quick-build.bat` - Fast Build & Sync

**Use this when:** You want to quickly build and sync changes to Android without opening Android Studio.

**What it does:**

1. Runs `npm run build` - Builds the web app
2. Runs `npx cap sync android` - Syncs to Android

**How to use:**

- Double-click `quick-build.bat` in File Explorer
- Or run from terminal: `.\quick-build.bat`

**When to use:**

- Quick iterations during development
- When you want to build APK manually using command line later
- When Android Studio is already open

---

### 2️⃣ `build-android.bat` - Full Build with Android Studio

**Use this when:** You want to build and immediately open Android Studio to generate APK.

**What it does:**

1. Runs `npm run build` - Builds the web app
2. Runs `npx cap sync android` - Syncs to Android
3. Runs `npx cap open android` - Opens Android Studio

**How to use:**

- Double-click `build-android.bat` in File Explorer
- Or run from terminal: `.\build-android.bat`

**When to use:**

- When you want to build APK from Android Studio UI
- Final builds before testing on device
- When you need to see Android Studio for debugging

---

## Typical Workflow 🔄

### During Development:

1. Make changes to your Vue/TypeScript code
2. Run `quick-build.bat`
3. Changes are synced to Android

### Building APK for Testing:

1. Run `build-android.bat`
2. Wait for Android Studio to open
3. In Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. Install on device: `adb install app-debug.apk`

### Alternative - Command Line APK Build:

1. Run `quick-build.bat`
2. Open terminal and run:
   ```bash
   cd android
   .\gradlew assembleDebug
   ```
3. APK location: `android\app\build\outputs\apk\debug\app-debug.apk`

---

## Development Tips 💡

### For Web Development (Desktop Browser):

```bash
npm run dev
# Opens http://localhost:4200
# Hot reload enabled - changes appear instantly
```

### For Android Development:

```bash
# Option 1: Use scripts
.\quick-build.bat

# Option 2: Manual commands
npm run build && npx cap sync android

# Option 3: Live reload on device (advanced)
npx cap run android --livereload --external
```

---

## Troubleshooting 🔧

### Build fails with "npm not found"

- Make sure you have Node.js installed
- Restart terminal after installing Node.js

### "Access denied" or permission errors

- Right-click the .bat file > "Run as administrator"

### Android Studio doesn't open

- Make sure Android Studio is installed
- Check if `npx cap open android` works from terminal

### Changes not appearing in app

1. Make sure you ran the build scripts
2. Uninstall old app from device
3. Reinstall fresh APK
4. Clear app data: Settings > Apps > Your App > Clear Data

---

## What Each Command Does 📚

| Command                                 | Purpose                           | When to Use                   |
| --------------------------------------- | --------------------------------- | ----------------------------- |
| `npm run build`                         | Builds Vue app to `dist/` folder  | Before every Android sync     |
| `npx cap sync android`                  | Copies `dist/` to Android project | After every build             |
| `npx cap open android`                  | Opens Android Studio              | When you need Android Studio  |
| `cd android && .\gradlew assembleDebug` | Builds APK via command line       | Alternative to Android Studio |

---

## Pro Tips 🎯

1. **After code changes:** Always run build → sync → install
2. **Keep Android Studio updated** for best compatibility
3. **Use quick-build.bat** for faster iterations
4. **Check device logs:** `adb logcat` for debugging
5. **Chrome DevTools:** `chrome://inspect` for web debugging

---

## Files Structure 📁

```
app-avd/
├── src/                    # Your Vue source code
├── dist/                   # Built web files (generated)
├── android/                # Android native project
│   └── app/
│       └── src/main/assets/public/  # Synced web files
├── quick-build.bat         # Script for build + sync
├── build-android.bat       # Script for build + sync + Android Studio
└── ANDROID_BUILD_INSTRUCTIONS.md  # Detailed instructions
```

---

**Need more help?** Check `ANDROID_BUILD_INSTRUCTIONS.md` for detailed Android-specific information!
