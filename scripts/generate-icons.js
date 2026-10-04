import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

function createIcon(size, filename) {
  const png = new PNG({ width: size, height: size });

  const rBg = 5, gBg = 150, bBg = 105; // Emerald 600 #059669
  const rBgDark = 6, gBgDark = 78, bBgDark = 59; // Emerald 900 #064e3b
  const rCup = 245, gCup = 158, bCup = 11; // Amber 500 #f59e0b
  const rWhite = 255, gWhite = 255, bWhite = 255;
  const rStraw = 239, gStraw = 68, bStraw = 68; // Red 500

  const center = size / 2;
  const radius = size * 0.46;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const t = (x + y) / (size * 2);
      const bgR = Math.round(rBg * (1 - t) + rBgDark * t);
      const bgG = Math.round(gBg * (1 - t) + gBgDark * t);
      const bgB = Math.round(bBg * (1 - t) + bBgDark * t);

      // Default background with rounded square
      const dx = Math.abs(x - center);
      const dy = Math.abs(y - center);
      const cornerR = size * 0.22;
      const insideSquare = (dx <= center - cornerR || dy <= center - cornerR ||
        Math.hypot(dx - (center - cornerR), dy - (center - cornerR)) <= cornerR);

      if (!insideSquare) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      let r = bgR;
      let g = bgG;
      let b = bgB;
      let a = 255;

      // Draw Straw
      const strawX1 = size * 0.54, strawY1 = size * 0.16;
      const strawX2 = size * 0.50, strawY2 = size * 0.36;
      if (x >= size * 0.49 && x <= size * 0.56 && y >= size * 0.16 && y <= size * 0.36) {
        r = rStraw; g = gStraw; b = bStraw;
      }

      // Draw Lid
      if (y >= size * 0.33 && y <= size * 0.38 && x >= size * 0.28 && x <= size * 0.72) {
        r = rWhite; g = rWhite; b = rWhite;
      }

      // Draw Cup Body
      const cupTopY = size * 0.38;
      const cupBottomY = size * 0.78;
      if (y >= cupTopY && y <= cupBottomY) {
        const factor = (y - cupTopY) / (cupBottomY - cupTopY);
        const halfWidth = (size * 0.32) * (1 - factor * 0.24);
        if (Math.abs(x - center) <= halfWidth) {
          r = Math.round(rCup * (1 - factor * 0.2));
          g = Math.round(gCup * (1 - factor * 0.25));
          b = Math.round(bCup * (1 - factor * 0.3));

          // Boba pearls at bottom
          if (y > size * 0.65) {
            const px = ((x - center) / halfWidth);
            if (Math.sin(x * 0.2) * Math.cos(y * 0.2) > 0.4) {
              r = 69; g = 26; b = 3; // Boba brown
            }
          }
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  const outPath = path.join(process.cwd(), 'public', filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

createIcon(192, 'pwa-192x192.png');
createIcon(512, 'pwa-512x512.png');
createIcon(512, 'pwa-maskable-512x512.png');
createIcon(180, 'apple-touch-icon.png');
createIcon(32, 'favicon.ico');
