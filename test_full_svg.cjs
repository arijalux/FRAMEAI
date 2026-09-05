const fs = require('fs');
const { execSync } = require('child_process');

// In local coordinates centered at (500, 330):
// A 180° rotation of a point (x, y) around (500, 330) is:
// (1000 - x, 660 - y)

// Let's define the single swoosh arm in absolute coordinates for viewBox="0 0 1000 660":
// Swoosh 1 (Upper arm):
// Starts at tip (12, 476) -> outer curve over the top -> right turn -> inner tail at (655, 360)
// -> inner curve along top ellipse -> back to tip (12, 476)

const arm1_d = `
  M 12,476
  C 45,395 125,275 240,175
  C 355,75 490,20 635,12
  C 780,4 895,42 952,112
  C 980,146 982,185 960,225
  C 938,265 890,302 825,335
  C 765,365 705,385 655,392
  C 725,362 795,322 845,275
  C 895,228 920,185 905,152
  C 885,110 805,75 685,65
  C 565,55 435,78 320,132
  C 205,186 115,268 52,362
  C 25,405 12,445 12,476 Z
`;

console.log('Ready to test arm1 and rotation');
