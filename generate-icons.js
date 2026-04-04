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
    await sharp(inputSvg)
      .resize(size, size)
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
