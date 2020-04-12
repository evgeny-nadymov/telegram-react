/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function getBadgeSelectedColor(rgb) {
    const primaryHLS = RGBToHSL(rgb);
    primaryHLS.l += 15;

    return `hsl(${primaryHLS.h}, ${primaryHLS.s}%, ${primaryHLS.l}%)`;
}

export function RGBToHSL(rgb) {
    let r = 0, g = 0, b = 0;

    // 3 digits
    if (rgb.length === 4) {
        r = Number.parseInt(rgb[1] + rgb[1], 16);
        g = Number.parseInt(rgb[2] + rgb[2], 16);
        b = Number.parseInt(rgb[3] + rgb[3], 16);

        // 6 digits
    } else if (rgb.length === 7) {
        r = Number.parseInt(rgb[1] + rgb[2], 16);
        g = Number.parseInt(rgb[3] + rgb[4], 16);
        b = Number.parseInt(rgb[5] + rgb[6], 16);
    }

    // Make r, g, and b fractions of 1
    r /= 255;
    g /= 255;
    b /= 255;

    // Find greatest and smallest channel values
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    // Calculate hue
    // No difference
    if (delta === 0)
        h = 0;
    // Red is max
    else if (cmax === r)
        h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax === g)
        h = (b - r) / delta + 2;
    // Blue is max
    else
        h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;

    // Calculate lightness
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    //return "hsl(" + h + "," + s + "%," + l + "%)";
    return { h, s, l }
}