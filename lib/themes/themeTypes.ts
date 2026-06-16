import { TimeOfDay } from "@/lib/timeUtils";

/**
 * Color palette for a specific time-of-day in a theme
 */
export interface PaletteConfig {
  sky: [string, string]; // [top, bottom] gradient colors
  horizon: string;
  ground: string;
  primary: string; // main accent color
  secondary: string; // secondary accent
  amoled?: {
    sky: [string, string];
    horizon: string;
    ground: string;
    primary: string;
    secondary: string;
  };
}

/**
 * Complete palette set for a theme (all 4 times of day)
 */
export interface ThemePalettes {
  day: PaletteConfig;
  afternoon: PaletteConfig;
  evening: PaletteConfig;
  night: PaletteConfig;
}

/**
 * Theme component props
 */
export interface ThemeComponentProps {
  tod: TimeOfDay;
  palette: PaletteConfig;
  viewW: number;
  viewH: number;
  variantSeed: number;
  prefersReducedMotion: boolean;
}

/**
 * Theme renderer function signature
 */
export type ThemeRenderer = (props: ThemeComponentProps) => React.ReactNode;

/**
 * Available themes
 */
export type ThemeName = "lush_lake" | "tropical_beach" | "crimson_desert" | "cyber_alpine" | "deep_cosmos";

/**
 * Theme definition
 */
export interface ThemeDefinition {
  id: ThemeName;
  name: string;
  description: string;
  palettes: ThemePalettes;
  renderer: ThemeRenderer;
}

/**
 * Theme registry mapping
 */
export type ThemeRegistry = Record<ThemeName, ThemeDefinition>;
