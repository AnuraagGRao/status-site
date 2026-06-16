import { ThemeRegistry, ThemeName } from "./themeTypes";
import { lushLakeTheme } from "./lushLake";
import { tropicalBeachTheme } from "./tropicalBeach";
import { crimsonDesertTheme } from "./crimsonDesert";
import { cyberAlpineTheme } from "./cyberAlpine";
import { deepCosmosTheme } from "./deepCosmos";

// Export ThemeName type for use in components
export type { ThemeName };

/**
 * Complete theme registry
 */
export const THEME_REGISTRY: ThemeRegistry = {
  lush_lake: lushLakeTheme,
  tropical_beach: tropicalBeachTheme,
  crimson_desert: crimsonDesertTheme,
  cyber_alpine: cyberAlpineTheme,
  deep_cosmos: deepCosmosTheme,
};

/**
 * Get a theme by ID
 */
export function getTheme(id: ThemeName) {
  return THEME_REGISTRY[id];
}

/**
 * Get all available themes (for UI selector)
 */
export function getAllThemes() {
  return Object.values(THEME_REGISTRY).map((theme) => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
  }));
}

/**
 * Get theme names (for validation/iteration)
 */
export function getThemeNames(): ThemeName[] {
  return Object.keys(THEME_REGISTRY) as ThemeName[];
}

/**
 * Validate if theme ID is valid
 */
export function isValidTheme(id: unknown): id is ThemeName {
  return typeof id === "string" && id in THEME_REGISTRY;
}
