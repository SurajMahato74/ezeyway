// Run this script to generate app icons
// You need to install: npm install canvas
const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background - golden yellow
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, size, size);
    
    // Add rounded corners
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.125);
    ctx.fill();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
    
    // Text - EZY
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${size * 0.25}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EZY', size / 2, size / 2);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`Generated ${filename}`);
}

// Generate icons for different densities
const icons = [
    { size: 48, path: 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png' },
    { size: 72, path: 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png' },
    { size: 96, path: 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png' },
    { size: 144, path: 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png' },
    { size: 192, path: 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png' }
];

icons.forEach(icon => {
    generateIcon(icon.size, icon.path);
});

console.log('All icons generated successfully!');