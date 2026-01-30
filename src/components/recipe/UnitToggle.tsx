"use client";

import { useState, useTransition } from "react";
import { updateUnitSystemAction } from "@/lib/actions/preferences";
import type { UnitSystem } from "@/lib/units";

interface UnitToggleProps {
  initialUnitSystem: UnitSystem;
  onUnitChange?: (unitSystem: UnitSystem) => void;
}

const unitOptions: { value: UnitSystem; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

export function UnitToggle({ initialUnitSystem, onUnitChange }: UnitToggleProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialUnitSystem);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newUnitSystem: UnitSystem) => {
    setUnitSystem(newUnitSystem);
    onUnitChange?.(newUnitSystem);

    startTransition(async () => {
      const result = await updateUnitSystemAction(newUnitSystem);
      if (!result.success) {
        console.error("Failed to save unit preference:", result.error);
        // Revert on error
        setUnitSystem(initialUnitSystem);
        onUnitChange?.(initialUnitSystem);
      }
    });
  };

  return (
    <div className="flex items-center space-x-1 bg-surface-2 rounded-lg p-1">
      {unitOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleChange(option.value)}
          disabled={isPending}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${
            unitSystem === option.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          } ${isPending ? "opacity-50" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
