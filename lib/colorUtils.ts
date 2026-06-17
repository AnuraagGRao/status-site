/**
 * Color utility functions for contrast and visibility.
 * Uses relative luminance to determine if text should be light or dark.
 */

/**
 * Convert hex color to RGB values (0-1 range)
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Calculate relative luminance of a color using WCAG formula
 * Range: 0 (darkest) to 1 (lightest)
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5; // fallback for invalid colors

  // Apply gamma correction
  const r = rgb.r <= 0.03928 ? rgb.r / 12.92 : Math.pow((rgb.r + 0.055) / 1.055, 2.4);
  const g = rgb.g <= 0.03928 ? rgb.g / 12.92 : Math.pow((rgb.g + 0.055) / 1.055, 2.4);
  const b = rgb.b <= 0.03928 ? rgb.b / 12.92 : Math.pow((rgb.b + 0.055) / 1.055, 2.4);

  // Luminance formula
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determine if background is light or dark based on luminance
 * Returns "light" if background is bright (use dark text)
 * Returns "dark" if background is dim (use light text)
 */
export function getBackgroundBrightness(hexColor: string): "light" | "dark" {
  const luminance = getLuminance(hexColor);
  // Threshold: 0.5 means 50% brightness
  // Slightly lower threshold (0.45) to be conservative and prefer light text
  return luminance > 0.45 ? "light" : "dark";
}

/**
 * Get text color based on background brightness
 * Also accepts alternative colors for better harmony
 */
export function getTextColor(
  backgroundHex: string,
  options?: {
    darkText?: string;
    lightText?: string;
  }
): string {
  const brightness = getBackgroundBrightness(backgroundHex);
  const darkText = options?.darkText ?? "#1a1a1a";
  const lightText = options?.lightText ?? "#ffffff";

  return brightness === "light" ? darkText : lightText;
}

/**
 * Get muted/secondary text color for slightly lower contrast
 */
export function getSecondaryTextColor(
  backgroundHex: string,
  options?: {
    darkText?: string;
    lightText?: string;
  }
): string {
  const brightness = getBackgroundBrightness(backgroundHex);
  const darkText = options?.darkText ?? "#4a4a4a";
  const lightText = options?.lightText ?? "#e0e0e0";

  return brightness === "light" ? darkText : lightText;
}

/**
 * Get text color for an averaged palette (used for card backgrounds)
 * Averages the sky gradient colors to determine overall brightness
 */
export function getTextColorForPalette(
  skyGradient: [string, string],
  options?: {
    darkText?: string;
    lightText?: string;
  }
): string {
  // Average the sky gradient (top to bottom)
  const avgLuminance = (getLuminance(skyGradient[0]) + getLuminance(skyGradient[1])) / 2;
  
  const brightness = avgLuminance > 0.45 ? "light" : "dark";
  const darkText = options?.darkText ?? "#1a1a1a";
  const lightText = options?.lightText ?? "#ffffff";

  return brightness === "light" ? darkText : lightText;
}

/**
 * Get secondary text color for an averaged palette
 */
export function getSecondaryTextColorForPalette(
  skyGradient: [string, string],
  options?: {
    darkText?: string;
    lightText?: string;
  }
): string {
  const avgLuminance = (getLuminance(skyGradient[0]) + getLuminance(skyGradient[1])) / 2;
  
  const brightness = avgLuminance > 0.45 ? "light" : "dark";
  const darkText = options?.darkText ?? "#4a4a4a";
  const lightText = options?.lightText ?? "#e0e0e0";

  return brightness === "light" ? darkText : lightText;
}
