const fs = require('fs');
const path = require('path');

// Create SVG icons for different sizes
const createEZYIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="#FFD700"/>
  <text x="${size/2}" y="${size * 0.62}" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold" text-anchor="middle" fill="#000000">EZY</text>
</svg>`;
};

const createForegroundIcon = (size) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.3;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#FFD700"/>
  <text x="${centerX}" y="${centerY + radius * 0.15}" font-family="Arial, sans-serif" font-size="${radius * 0.6}" font-weight="bold" text-anchor="middle" fill="#000000">EZY</text>
</svg>`;
};

// Icon sizes for different densities
const iconSizes = [
  { density: 'mdpi', size: 48 },
  { density: 'hdpi', size: 72 },
  { density: 'xhdpi', size: 96 },
  { density: 'xxhdpi', size: 144 },
  { density: 'xxxhdpi', size: 192 }
];

const foregroundSizes = [
  { density: 'mdpi', size: 108 },
  { density: 'hdpi', size: 162 },
  { density: 'xhdpi', size: 216 },
  { density: 'xxhdpi', size: 324 },
  { density: 'xxxhdpi', size: 432 }
];

const androidResPath = './android/app/src/main/res';

// Create directories and SVG files
iconSizes.forEach(({ density, size }) => {
  const dir = path.join(androidResPath, `mipmap-${density}`);
  
  // Create launcher icon
  const launcherSvg = createEZYIcon(size);
  fs.writeFileSync(path.join(dir, 'ic_launcher.svg'), launcherSvg);
  
  // Create round launcher icon (same as regular)
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.svg'), launcherSvg);
  
  console.log(`Created icons for ${density} (${size}x${size})`);
});

// Create foreground icons
foregroundSizes.forEach(({ density, size }) => {
  const dir = path.join(androidResPath, `mipmap-${density}`);
  
  const foregroundSvg = createForegroundIcon(size);
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.svg'), foregroundSvg);
  
  console.log(`Created foreground icon for ${density} (${size}x${size})`);
});

console.log('\\n✅ All EZY app icons created successfully!');
console.log('📱 Your app will now show the golden EZY logo as the icon.');
console.log('🔄 Run: npx cap sync android && npx cap run android');