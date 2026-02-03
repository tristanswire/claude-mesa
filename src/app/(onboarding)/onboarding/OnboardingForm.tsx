"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  completeOnboardingAction,
  skipOnboardingAction,
  type OnboardingFormState,
} from "@/lib/actions/onboarding";
import type { UnitSystem } from "@/lib/units";
import { useState, useTransition } from "react";

const unitOptions: { value: UnitSystem; label: string; description: string }[] = [
  {
    value: "original",
    label: "Original",
    description: "Keep units as the recipe author wrote them",
  },
  {
    value: "metric",
    label: "Metric",
    description: "Convert to grams, milliliters, and Celsius",
  },
  {
    value: "imperial",
    label: "Imperial",
    description: "Convert to ounces, cups, and Fahrenheit",
  },
];

export function OnboardingForm() {
  const [selectedUnit, setSelectedUnit] = useState<UnitSystem>("original");
  const [isSkipping, startSkipTransition] = useTransition();
  const [state, formAction, isPending] = useActionState<OnboardingFormState, FormData>(
    completeOnboardingAction,
    { success: false }
  );

  const handleSkip = () => {
    startSkipTransition(async () => {
      await skipOnboardingAction();
    });
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl">Welcome to Mesa</CardTitle>
        <CardDescription className="text-base">
          Let&apos;s personalize your recipe experience
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form action={formAction}>
          {/* Unit system selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground mb-3">
              How would you like to see measurements?
            </label>

            <div className="space-y-2">
              {unitOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedUnit === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="unitSystem"
                    value={option.value}
                    checked={selectedUnit === option.value}
                    onChange={(e) => setSelectedUnit(e.target.value as UnitSystem)}
                    className="mt-1 h-4 w-4 text-primary border-border focus:ring-primary"
                  />
                  <div>
                    <span className="block font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="block text-sm text-muted">
                      {option.description}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error message */}
          {state.error && (
            <p className="text-sm text-error mt-4">{state.error}</p>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3 mt-6">
            <Button
              type="submit"
              isLoading={isPending}
              className="w-full"
            >
              Get Started
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isPending || isSkipping}
              className="w-full"
            >
              {isSkipping ? "Skipping..." : "Skip for now"}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted text-center mt-4">
          You can change this anytime in Settings
        </p>
      </CardContent>
    </Card>
  );
}
