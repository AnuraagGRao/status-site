import React from "react";

interface PresetButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  ariaLabel: string;
}

/**
 * Reusable preset time button component with consistent styling and touch targets.
 * Touch target is now 48px+ for WCAG compliance on mobile.
 */
export const PresetButton = React.forwardRef<HTMLButtonElement, PresetButtonProps>(
  ({ icon, label, isActive, onClick, ariaLabel }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`flex flex-col sm:flex-row items-center justify-center gap-1 rounded-lg px-3 py-2.5 sm:px-3 sm:py-2 text-xs font-medium border transition-all duration-200 cursor-pointer min-h-12 sm:min-h-10 ${
          isActive
            ? "text-white bg-white/20 border-white/30"
            : "text-white/70 bg-white/10 hover:bg-white/14 border-white/15 hover:text-white"
        }`}
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
