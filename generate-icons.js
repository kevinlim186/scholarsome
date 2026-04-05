const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = 'apps/front/src/assets/header/scholarsome-logo-purple-lowercase.svg';
const outputDir = 'apps/front/src/assets/icons';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // The original SVG is wide. We want to extract a square icon.
  // Since the logo is text-based, we'll try to center it and add padding,
  // or use just the first letter if it fits better.
  // For this version, we will resize and contain the full logo with padding.

  // Since the logo is text "scholarsome", for a square icon we will
  // extract a square area or just ensure it is properly contained with padding.
  for (const size of sizes) {
    await sharp(inputSvg)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 111, g: 66, b: 193, alpha: 1 } // Brand purple background
      })
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
