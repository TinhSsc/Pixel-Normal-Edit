import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('./public/avatar.svg');
const out192 = path.resolve('./public/pwa-192x192.png');
const out512 = path.resolve('./public/pwa-512x512.png');

async function generate() {
  if (!fs.existsSync(svgPath)) {
    console.error('avatar.svg not found at', svgPath);
    return;
  }
  
  await sharp(svgPath)
    .resize(192, 192)
    .png()
    .toFile(out192);
    
  console.log('Generated pwa-192x192.png');
  
  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(out512);
    
  console.log('Generated pwa-512x512.png');
}

generate().catch(console.error);
