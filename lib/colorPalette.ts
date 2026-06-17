/**
 * Application color palette based on ColorHunt design trends
 * Uses modern, vibrant colors with excellent contrast and harmony
 */

// Primary accent colors (Neon/Vibrant scheme)
export const COLOR_PALETTE = {
  // Neon accents
  neon: {
    cyan: "#00D9FF",
    magenta: "#FF006E",
    yellow: "#FFE66D",
    lime: "#00FF41",
    pink: "#FF1493",
    purple: "#7209B7",
  },

  // Status colors
  status: {
    working: "#667eea", // purple
    away: "#4facfe", // cyan
    accent: "#764ba2", // vibrant purple
  },

  // Gradient palettes (inspired by ColorHunt)
  gradients: {
    // Sunset gradient
    sunset: {
      start: "#FF6B35",
      end: "#FDB833",
    },
    // Ocean gradient
    ocean: {
      start: "#00D4FF",
      end: "#0099FF",
    },
    // Neon gradient
    neon: {
      start: "#7209B7",
      end: "#FF006E",
    },
    // Forest gradient
    forest: {
      start: "#1B5E20",
      end: "#4CAF50",
    },
    // Aurora gradient
    aurora: {
      start: "#00D9FF",
      end: "#FF006E",
    },
  },

  // UI colors
  ui: {
    // Card backgrounds (glassmorphic)
    glass: "rgba(255,255,255,0.08)",
    glassHover: "rgba(255,255,255,0.12)",
    glassBorder: "rgba(255,255,255,0.16)",

    // Button states
    buttonDefault: "rgba(255,255,255,0.10)",
    buttonHover: "rgba(255,255,255,0.16)",
    buttonActive: "rgba(255,255,255,0.25)",

    // Text
    textPrimary: "#ffffff",
    textSecondary: "#e0e0e0",
    textMuted: "#a0a0a0",
  },

  // Theme-specific accent highlights
  themeAccents: {
    lush_lake: "#1B5E20",
    tropical_beach: "#00B8A9",
    crimson_desert: "#ff6600",
    cyber_alpine: "#00ffff",
    deep_cosmos: "#FF00FF",
  },
};

export default COLOR_PALETTE;
