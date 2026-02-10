"use client";

import { useTransition } from "react";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useTheme, type ThemePreference } from "@/components/providers/ThemeProvider";
import { updateThemePreferenceAction } from "@/lib/actions/preferences";

interface ThemeSelectorProps {
  initialValue?: ThemePreference;
}

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export function ThemeSelector({}: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    const newTheme = value as ThemePreference;
    // Apply immediately in the UI
    setTheme(newTheme);

    // Persist to database
    startTransition(async () => {
      await updateThemePreferenceAction(newTheme);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <SegmentedControl
        value={theme}
        onChange={handleChange}
        options={themeOptions}
      />
      {isPending && (
        <span className="text-sm text-muted">Saving...</span>
      )}
    </div>
  );
}
