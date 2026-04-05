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
  for (const size of sizes) {
    // Generate square icon with padding for better visibility as app icon
    await sharp(inputSvg)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
