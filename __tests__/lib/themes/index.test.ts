import { describe, it, expect } from "vitest";
import {
  getTheme,
  getThemeNames,
  getAllThemes,
  THEME_REGISTRY,
} from "@/lib/themes";

describe("Theme System", () => {
  describe("THEME_REGISTRY", () => {
    it("contains all expected themes", () => {
      const expectedThemes = [
        "lush_lake",
        "tropical_beach",
        "crimson_desert",
        "cyber_alpine",
        "deep_cosmos",
      ];

      expectedThemes.forEach((themeName) => {
        expect(THEME_REGISTRY).toHaveProperty(themeName);
      });
    });

    it("each theme has required properties", () => {
      Object.values(THEME_REGISTRY).forEach((theme) => {
        expect(theme).toHaveProperty("id");
        expect(theme).toHaveProperty("name");
        expect(theme).toHaveProperty("palettes");
        expect(theme).toHaveProperty("renderer");
        expect(typeof theme.renderer).toBe("function");
        
        // Check palettes structure
        expect(theme.palettes).toHaveProperty("day");
        expect(theme.palettes).toHaveProperty("afternoon");
        expect(theme.palettes).toHaveProperty("evening");
        expect(theme.palettes).toHaveProperty("night");
      });
    });

    it("each palette has required color properties", () => {
      Object.values(THEME_REGISTRY).forEach((theme) => {
        ["day", "afternoon", "evening", "night"].forEach((tod) => {
          const palette = theme.palettes[tod as keyof typeof theme.palettes];
          expect(palette).toHaveProperty("sky");
          expect(palette).toHaveProperty("horizon");
          expect(palette).toHaveProperty("ground");
          expect(palette).toHaveProperty("primary");
          expect(palette).toHaveProperty("secondary");
          
          // Sky should be array of 2 colors
          expect(Array.isArray(palette.sky)).toBe(true);
          expect(palette.sky).toHaveLength(2);
        });
      });
    });
  });

  describe("getTheme", () => {
    it("returns correct theme by ID", () => {
      const theme = getTheme("lush_lake");
      expect(theme.id).toBe("lush_lake");
      expect(theme.name).toBe("Lush Lake");
    });

    it("returns deep cosmos theme", () => {
      const theme = getTheme("deep_cosmos");
      expect(theme.id).toBe("deep_cosmos");
      expect(theme.name).toBe("Deep Cosmos");
    });
  });

  describe("getThemeNames", () => {
    it("returns array of theme IDs", () => {
      const names = getThemeNames();
      expect(names).toBeInstanceOf(Array);
      expect(names.length).toBe(5);
      expect(names).toContain("lush_lake");
      expect(names).toContain("deep_cosmos");
    });
  });

  describe("getAllThemes", () => {
    it("returns array of theme objects", () => {
      const themes = getAllThemes();
      expect(themes).toBeInstanceOf(Array);
      expect(themes.length).toBe(5);
      expect(themes[0]).toHaveProperty("id");
      expect(themes[0]).toHaveProperty("name");
    });

    it("theme objects have both id and name", () => {
      const themes = getAllThemes();
      themes.forEach((theme) => {
        expect(typeof theme.id).toBe("string");
        expect(typeof theme.name).toBe("string");
      });
    });
  });

  describe("Dark Mode / AMOLED", () => {
    it("night palettes have AMOLED variants", () => {
      Object.values(THEME_REGISTRY).forEach((theme) => {
        expect(theme.palettes.night).toHaveProperty("amoled");
        
        const amoled = theme.palettes.night.amoled;
        if (amoled) {
          expect(amoled).toHaveProperty("sky");
          expect(amoled).toHaveProperty("horizon");
          expect(amoled).toHaveProperty("ground");
          expect(Array.isArray(amoled.sky)).toBe(true);
        }
      });
    });

    it("AMOLED palettes use dark colors", () => {
      Object.values(THEME_REGISTRY).forEach((theme) => {
        const amoled = theme.palettes.night.amoled;
        if (amoled) {
          // AMOLED should have very dark colors (mostly black)
          expect(amoled.sky[0].toLowerCase()).toContain("#000000");
        }
      });
    });
  });
});
