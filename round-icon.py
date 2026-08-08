#!/usr/bin/env python3
"""
iOS-Style Icon Rounder
Creates rounded icons with soft edges like iPhone app icons
Requires: Pillow (PIL)
Install: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw
    import os
except ImportError:
    print("❌ Pillow not installed!")
    print("Install it with: pip install Pillow")
    exit(1)

def round_corners(image, radius_percent=22.5):
    """
    Add iOS-style rounded corners to an image
    iOS uses approximately 22.5% border radius
    """
    # Ensure image is in RGBA mode
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # Create a mask
    width, height = image.size
    radius = int(min(width, height) * (radius_percent / 100))
    
    # Create rounded rectangle mask
    mask = Image.new('L', (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (width, height)], radius=radius, fill=255)
    
    # Apply mask
    output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    output.paste(image, (0, 0))
    output.putalpha(mask)
    
    return output

def main():
    input_path = os.path.join('public', 'favicon.png')
    output_path = os.path.join('public', 'favicon-rounded.png')
    
    if not os.path.exists(input_path):
        print(f"❌ Input file not found: {input_path}")
        print("Please make sure favicon.png exists in the public folder")
        return
    
    print(f"📂 Reading: {input_path}")
    
    # Open image
    img = Image.open(input_path)
    print(f"📐 Original size: {img.size[0]}x{img.size[1]}")
    
    # Create rounded version
    print("🎨 Applying iOS-style rounded corners (22.5% radius)...")
    rounded_img = round_corners(img, radius_percent=22.5)
    
    # Save
    rounded_img.save(output_path, 'PNG')
    print(f"✅ Saved rounded icon: {output_path}")
    print()
    print("📋 Next steps:")
    print("1. Check the favicon-rounded.png in the public folder")
    print("2. If you like it, replace favicon.png:")
    print(f"   • Delete: {input_path}")
    print(f"   • Rename: {output_path} to favicon.png")
    print("3. Run: npm run build && npx cap sync android")
    print()
    print("🎉 Done!")

if __name__ == '__main__':
    main()
