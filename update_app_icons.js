const fs = require('fs');
const path = require('path');

// Copy the existing logo to all icon locations
const logoPath = './src/assets/ezeywaylogo.png';
const androidResPath = './android/app/src/main/res';

const iconSizes = [
  { density: 'mdpi', folder: 'mipmap-mdpi' },
  { density: 'hdpi', folder: 'mipmap-hdpi' },
  { density: 'xhdpi', folder: 'mipmap-xhdpi' },
  { density: 'xxhdpi', folder: 'mipmap-xxhdpi' },
  { density: 'xxxhdpi', folder: 'mipmap-xxxhdpi' }
];

console.log('🔄 Updating app icons with your ezeyway logo...');

// Copy logo to all icon locations
iconSizes.forEach(({ density, folder }) => {
  const targetDir = path.join(androidResPath, folder);
  
  // Copy as launcher icon
  const launcherPath = path.join(targetDir, 'ic_launcher.png');
  fs.copyFileSync(logoPath, launcherPath);
  
  // Copy as round launcher icon
  const roundPath = path.join(targetDir, 'ic_launcher_round.png');
  fs.copyFileSync(logoPath, roundPath);
  
  // Copy as foreground icon
  const foregroundPath = path.join(targetDir, 'ic_launcher_foreground.png');
  fs.copyFileSync(logoPath, foregroundPath);
  
  console.log(`✅ Updated icons for ${density}`);
});

console.log('🎯 App icons updated successfully!');
console.log('📱 Your app will now show your ezeyway logo as the icon.');
console.log('🔄 Run: npx cap sync android && npx cap run android');