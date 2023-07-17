/**
 * TODO - refactor this as a (jQuery?) plugin!
 **/

import { HexString } from "type-library";
import { HexTripleNumber } from "./types";

// Converts a #ffffff hex string into an [r,g,b] array
function h2r(hex: HexString): HexTripleNumber | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? ([
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ] as HexTripleNumber)
    : null;
}

// Inverse of the above
function r2h(rgb: HexTripleNumber): HexString {
  return `#${((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2])
    .toString(16)
    .slice(1)}`;
}

// Interpolates two [r,g,b] colors and returns an [r,g,b] of the result
// Taken from the awesome ROT.js roguelike dev library at
// https://github.com/ondras/rot.js
function _interpolateColor(
  color1: HexTripleNumber,
  color2: HexTripleNumber,
  factor = 0.5
): HexTripleNumber {
  const result = color1.map((_, ii) =>
    Math.round(color1[ii] + factor * (color2[ii] - color1[ii]))
  ) as HexTripleNumber;
  return result;
}

// const rgb2hsl = function (color: HexTripleNumber): HexTripleNumber {
//   const r = color[0] / 255;
//   const g = color[1] / 255;
//   const b = color[2] / 255;

//   const max = Math.max(r, g, b),
//     min = Math.min(r, g, b);
//   let h: number = (max + min) / 2;
//   let s: number = h;
//   const l: number = h;
//   if (max == min) {
//     h = 0; // achromatic
//     s = 0;
//   } else {
//     const d = max - min;
//     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
//     switch (max) {
//       case r:
//         h = (g - b) / d + (g < b ? 6 : 0);
//         break;
//       case g:
//         h = (b - r) / d + 2;
//         break;
//       case b:
//         h = (r - g) / d + 4;
//         break;
//     }
//     h /= 6;
//   }

//   return [h, s, l] as HexTripleNumber;
// };

// function hue2rgb(p: number, q: number, t: number) {
//   if (t < 0) t += 1;
//   if (t > 1) t -= 1;
//   if (t < 1 / 6) return p + (q - p) * 6 * t;
//   if (t < 1 / 2) return q;
//   if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
//   return p;
// }

// const hsl2rgb = function (color: HexTripleNumber) {
//   let l = color[2];

//   if (color[1] == 0) {
//     l = Math.round(l * 255) as HexTripleNumber[number];
//     return [l, l, l];
//   } else {
//     const s = color[1];
//     const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
//     const p = 2 * l - q;
//     const r = hue2rgb(p, q, color[0] + 1 / 3);
//     const g = hue2rgb(p, q, color[0]);
//     const b = hue2rgb(p, q, color[0] - 1 / 3);
//     return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
//   }
// };

// const _interpolateHSL = function (
//   color1: HexTripleNumber,
//   color2: HexTripleNumber,
//   factor: number
// ) {
//   if (arguments.length < 3) {
//     factor = 0.5;
//   }
//   const hsl1 = rgb2hsl(color1);
//   const hsl2 = rgb2hsl(color2);
//   for (let i = 0; i < 3; i++) {
//     hsl1[i] += (factor * (hsl2[i] - hsl1[i])) as HexTripleNumber[number];
//   }
//   return hsl2rgb(hsl1);
// };

export function interpolateHexStrings(
  hexStringA: HexString,
  hexStringB: HexString
): HexString {
  const tripleA = h2r(hexStringA);
  const tripleB = h2r(hexStringB);
  if (tripleA === null || tripleB === null) {
    return "#FFFFFF";
  }
  console.log("TEST123", tripleA, tripleB);
  const intermediatePoint = _interpolateColor(tripleA, tripleB);
  return r2h(intermediatePoint);
}
