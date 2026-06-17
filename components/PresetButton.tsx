import React from "react";

interface PresetButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  ariaLabel: string;
  preset?: "live" | "day" | "afternoon" | "evening" | "night";
}

/**
 * Reusable preset time button component with consistent styling and touch targets.
 * Touch target is now 48px+ for WCAG compliance on mobile.
 * Uses theme-aware colors from ColorHunt palette.
 */
export const PresetButton = React.forwardRef<HTMLButtonElement, PresetButtonProps>(
  ({ icon, label, isActive, onClick, ariaLabel, preset }, ref) => {
    const getPresetColor = () => {
      if (!isActive) return undefined;
      const colors: Record<string, string> = {
        live: "#00D9FF",
        day: "#FFE66D",
        afternoon: "#FF6B35",
        evening: "#FF006E",
        night: "#7209B7",
      };
      return colors[preset || "live"];
    };

    const accentColor = getPresetColor();

    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`flex flex-col sm:flex-row items-center justify-center gap-1 rounded-lg px-3 py-2.5 sm:px-3 sm:py-2 text-xs font-medium border transition-all duration-200 cursor-pointer min-h-12 sm:min-h-10 ${
          isActive
            ? "text-white border-opacity-50"
            : "text-white/70 bg-white/10 hover:bg-white/14 border-white/15 hover:text-white"
        }`}
        style={
          isActive
            ? {
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
                borderColor: `${accentColor}60`,
                color: accentColor,
              }
            : undefined
        }
        aria-label={ariaLabel}
        aria-pressed={isActive}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }
);

PresetButton.displayName = "PresetButton";
