import fs from 'fs';

// 1. Mathematically pristine orbital ring arm
const orbitArm = `M 476,-6 C 436,66 338,148 194,198 C 52,246 -118,252 -258,214 C -362,186 -436,122 -476,6 C -432,96 -352,156 -254,182 C -118,218 48,214 186,170 C 324,126 422,54 476,-6 Z`;

// 2. Refined Didone Monogram 'bj'
const monogramPath = `M 288,162 C 310,144 340,116 380,86 L 380,246 C 406,228 438,218 474,218 C 536,218 576,256 584,306 L 584,272 L 646,272 L 646,520 C 646,594 602,654 536,662 C 468,670 414,632 414,580 C 414,544 440,518 472,518 C 504,518 530,544 530,576 C 530,600 508,622 480,622 C 460,622 444,608 442,592 C 452,586 468,588 474,598 C 480,608 496,610 506,598 C 516,586 514,562 494,548 C 474,534 442,546 438,574 C 434,604 466,644 528,644 C 576,644 604,604 604,534 L 604,408 C 584,434 550,458 474,458 C 432,458 398,440 380,414 L 380,458 L 324,458 L 324,192 C 324,176 310,168 288,162 Z M 380,292 L 380,392 C 396,412 424,426 456,426 C 510,426 548,384 548,338 C 548,294 510,252 456,252 C 424,252 396,270 380,292 Z`;

// Refined Standalone Emblem (1000 x 670, pure black, transparent background)
const emblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 670" fill="#000000" aria-label="BJ Homemade Brand Emblem">
  <defs>
    <path id="bj-orbit-half" d="${orbitArm}" />
  </defs>

  <!-- Orbital Dual-Swoosh Galaxy Rings (Tilted by -28.5 deg around center 500, 335) -->
  <g transform="translate(500, 335) rotate(-28.5)">
    <use href="#bj-orbit-half" />
    <use href="#bj-orbit-half" transform="rotate(180)" />
  </g>

  <!-- Monogram 'bj' with Classical Didone Serif Proportions -->
  <g id="bj-monogram">
    <path d="${monogramPath}" />
    <circle cx="616" cy="216" r="34" />
  </g>
</svg>
`;

// Refined Complete Brand Logo (Horizontal Lockup with exact brand name "BJ Homemade")
// Pure black (#000000), transparent background, no borders, no gradients, no boxes
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 140" fill="#000000" aria-label="BJ Homemade Logo">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&amp;display=swap');
      .bj-brand-text {
        font-family: 'Playfair Display', Didot, 'Bodoni MT', Georgia, serif;
        font-size: 52px;
        font-weight: 700;
        letter-spacing: -0.015em;
        fill: #000000;
      }
      .bj-brand-sub {
        font-weight: 500;
        letter-spacing: -0.01em;
      }
    </style>
    <path id="bj-full-orbit-half" d="${orbitArm}" />
  </defs>

  <!-- Refined Brand Emblem (Scaled 0.17x to fit 170x114 px) -->
  <g transform="translate(10, 13) scale(0.17)">
    <g transform="translate(500, 335) rotate(-28.5)">
      <use href="#bj-full-orbit-half" />
      <use href="#bj-full-orbit-half" transform="rotate(180)" />
    </g>
    <g id="bj-full-monogram">
      <path d="${monogramPath}" />
      <circle cx="616" cy="216" r="34" />
    </g>
  </g>

  <!-- Refined Typography: "BJ Homemade" (Exact Capitalization, Solid Black, Transparent Background) -->
  <text x="196" y="88" class="bj-brand-text">BJ <tspan class="bj-brand-sub">Homemade</tspan></text>
</svg>
`;

fs.writeFileSync('public/bj-emblem.svg', emblemSvg, 'utf8');
fs.writeFileSync('public/bj-logo.svg', fullLogoSvg, 'utf8');
console.log('Saved public/bj-emblem.svg and public/bj-logo.svg');
