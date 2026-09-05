import fs from 'fs';

const pngBuf = fs.readFileSync('public/bj-logo.png');
const base64Png = pngBuf.toString('base64');

// Standalone SVG with exact uploaded logo
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1072" width="100%" height="100%" aria-label="BJ Homemade Logo">
  <image href="data:image/png;base64,${base64Png}" width="1600" height="1072" />
</svg>
`;

fs.writeFileSync('public/bj-emblem.svg', svgContent, 'utf8');
fs.writeFileSync('public/bj-logo.svg', svgContent, 'utf8');
console.log('Successfully updated public/bj-emblem.svg and public/bj-logo.svg with uploaded asset!');
