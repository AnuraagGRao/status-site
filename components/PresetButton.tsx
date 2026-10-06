import React, { memo } from "react";

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
export const PresetButton = memo(
  React.forwardRef<HTMLButtonElement, PresetButtonProps>(
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
          className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 sm:px-3 sm:py-2 text-xs font-medium border transition-all duration-200 cursor-pointer min-h-12 sm:min-h-10 ${
            isActive
              ? "text-[#0F1011] bg-[#ECEDEE] border-[#ECEDEE] font-bold shadow-[0_2px_12px_rgba(255,255,255,0.25)]"
              : "text-[#ECEDEE]/75 bg-white/[0.06] hover:bg-white/[0.12] border-white/10 hover:text-white"
          }`}
          aria-label={ariaLabel}
          aria-pressed={isActive}
        >
          {icon}
          <span>{label}</span>
        </button>
      );
    }
  )
);

PresetButton.displayName = "PresetButton";
