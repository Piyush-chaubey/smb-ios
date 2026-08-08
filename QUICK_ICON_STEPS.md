# Quick Icon Rounding Steps 🚀

## 3-Minute Guide

### Step 1: Open Tool

The file `icon-rounder.html` should be open in your browser.
If not, double-click it.

### Step 2: Upload & Download

1. Click **"📁 Select Image"** button
2. Choose `public/favicon.png`
3. See the preview (original vs rounded)
4. Click **"⬇️ Download Rounded Icon"**
5. Save it as `favicon-rounded.png`

### Step 3: Replace Icon

```bash
# In your project folder
cd public
del favicon.png
ren favicon-rounded.png favicon.png
cd ..
```

Or manually:

- Delete `public/favicon.png`
- Rename `favicon-rounded.png` to `favicon.png`

### Step 4: Build & Deploy

```bash
npm run build
npx cap sync android
```

## That's It! ✅

Your icon now has iOS-style soft rounded edges (22.5% radius).

---

## What You'll See 👀

### Before (Sharp Corners):

```
┌─────────────┐
│             │
│    ICON     │
│             │
└─────────────┘
```

### After (Soft Rounded Corners):

```
╭─────────────╮
│             │
│    ICON     │
│             │
╰─────────────╯
```

The rounded version looks more premium and matches iOS design standards!

---

## Visual Comparison

| Type                | Look | Usage                        |
| ------------------- | ---- | ---------------------------- |
| **Sharp Corners**   | ▢    | Android Material (old style) |
| **Rounded (22.5%)** | ▢̶    | iOS, Modern Android, PWA     |
| **Circle**          | ●    | WhatsApp, Telegram           |
| **Squircle**        | ⬜   | iOS, Premium apps            |

Your icon will have the "Rounded (22.5%)" style - the most widely used!

---

## Keyboard Shortcuts in Tool

- **Ctrl+O** - Open file (when focused on page)
- **Ctrl+S** - Download (when focused on page)

---

## Alternative: Online Tool

Don't want to use the HTML tool? Try:

1. Go to https://appicon.co/
2. Upload your `public/favicon.png`
3. Download iOS App Icon set
4. Use the 512x512 version

---

## Troubleshooting

**Tool not opening?**
→ Right-click `icon-rounder.html` → Open with → Chrome/Edge/Firefox

**Can't see preview?**
→ Make sure you selected an image file (PNG, JPG, etc.)

**Download button disabled?**
→ Upload an image first

**Icon looks weird?**
→ Make sure your original icon is square (same width & height)

---

## Pro Tip 💡

After rounding, you might also want to:

1. Add a subtle shadow for depth
2. Slightly brighten the colors (rounded icons show less surface area)
3. Keep important elements away from corners (safe zone: central 80%)

The HTML tool automatically applies subtle shadowing for a professional look!

---

**Time Estimate**: 3 minutes  
**Difficulty**: Very Easy  
**Result**: Professional iOS-style icon ✨
