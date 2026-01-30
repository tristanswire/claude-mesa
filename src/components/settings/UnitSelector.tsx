"use client";

import { useState, useTransition } from "react";
import { SegmentedControl } from "@/components/ui/Tabs";
import { updateUnitSystemAction } from "@/lib/actions/preferences";
import type { UnitSystem } from "@/lib/units";

interface UnitSelectorProps {
  initialValue: UnitSystem;
}

const unitOptions = [
  { value: "original", label: "Original" },
  { value: "metric", label: "Metric" },
  { value: "imperial", label: "Imperial" },
];

export function UnitSelector({ initialValue }: UnitSelectorProps) {
  const [value, setValue] = useState<UnitSystem>(initialValue);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newValue: string) => {
    const unitSystem = newValue as UnitSystem;
    setValue(unitSystem);

    startTransition(async () => {
      await updateUnitSystemAction(unitSystem);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <SegmentedControl
        value={value}
        onChange={handleChange}
        options={unitOptions}
      />
      {isPending && (
        <span className="text-sm text-muted">Saving...</span>
      )}
    </div>
  );
}
