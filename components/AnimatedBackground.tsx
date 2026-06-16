"use client";

import { TimeOfDay } from "@/lib/timeUtils";
import { SCENE_WIDTH, SCENE_HEIGHT } from "@/lib/sceneConstants";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { getTheme, isValidTheme } from "@/lib/themes";
import { ThemeName } from "@/lib/themes/themeTypes";

interface AnimatedBackgroundProps {
  tod: TimeOfDay;
  bgRef?: React.RefObject<HTMLElement | SVGSVGElement | null>;
  variantSeed?: number;
  darkMode?: boolean;
  themeName?: ThemeName;
}

export default function AnimatedBackground({
  tod,
  bgRef,
  variantSeed = 1,
  darkMode = false,
  themeName = "lush_lake",
}: AnimatedBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Validate theme
  if (!isValidTheme(themeName)) {
    console.warn(`Invalid theme: ${themeName}, falling back to lush_lake`);
    themeName = "lush_lake";
  }

  const theme = getTheme(themeName);
  const paletteConfig = theme.palettes[tod];

  // Apply dark mode AMOLED palette if available and enabled
  const palette = darkMode && paletteConfig.amoled ? paletteConfig.amoled : paletteConfig;

  const viewW = SCENE_WIDTH;
  const viewH = SCENE_HEIGHT;

  const renderedTheme = theme.renderer({
    tod,
    palette,
    viewW,
    viewH,
    variantSeed,
    prefersReducedMotion,
  });

  return (
    <div
      ref={bgRef as React.Ref<HTMLDivElement>}
      className="w-full h-full"
    >
      {renderedTheme}
    </div>
  );
}
