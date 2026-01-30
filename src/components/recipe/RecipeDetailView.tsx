"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/lib/schemas";
import type { Stack } from "@/lib/db/stacks";
import type { UnitSystem } from "@/lib/units";
import { formatIngredient } from "@/lib/units";
import { renderInstructions } from "@/lib/render";
import { UnitToggle } from "./UnitToggle";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { RecipeStacks } from "./RecipeStacks";
import { RecipeExportShare } from "./RecipeExportShare";
import { RecipePlaceholderImage } from "./RecipePlaceholderImage";
import { StepCard } from "./StepCard";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Badge";

interface RecipeDetailViewProps {
  recipe: Recipe;
  initialUnitSystem: UnitSystem;
  allStacks?: Stack[];
  currentStacks?: Stack[];
  initialShareToken?: string;
  initialShareId?: string;
}

export function RecipeDetailView({
  recipe,
  initialUnitSystem,
  allStacks = [],
  currentStacks = [],
  initialShareToken,
  initialShareId,
}: RecipeDetailViewProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(initialUnitSystem);

  // Render instructions with inline callouts
  const renderedInstructions = renderInstructions(
    recipe.instructions,
    recipe.ingredients,
    unitSystem
  );

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const totalTime =
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-6 transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to recipes
      </Link>

      {/* Hero Section */}
      <div className="bg-surface rounded-2xl overflow-hidden mb-8">
        {/* Hero Image */}
        <div className="relative aspect-[21/9] overflow-hidden">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          ) : (
            <RecipePlaceholderImage
              title={recipe.title}
              className="absolute inset-0 w-full h-full"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="text-white/80 text-sm md:text-base line-clamp-2 max-w-2xl">
                {recipe.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta bar */}
        <div className="px-6 md:px-8 py-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm">
            {recipe.servings && (
              <div className="flex items-center gap-2 text-muted">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>
                  <span className="font-medium text-foreground">{recipe.servings}</span>{" "}
                  servings
                </span>
              </div>
            )}
            {recipe.prepTimeMinutes && (
              <div className="flex items-center gap-2 text-muted">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  <span className="font-medium text-foreground">{formatTime(recipe.prepTimeMinutes)}</span>{" "}
                  prep
                </span>
              </div>
            )}
            {recipe.cookTimeMinutes && (
              <div className="flex items-center gap-2 text-muted">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                  />
                </svg>
                <span>
                  <span className="font-medium text-foreground">{formatTime(recipe.cookTimeMinutes)}</span>{" "}
                  cook
                </span>
              </div>
            )}
            {totalTime > 0 && (
              <div className="text-muted">
                <span className="font-medium text-foreground">{formatTime(totalTime)}</span>{" "}
                total
              </div>
            )}
          </div>
          <UnitToggle
            initialUnitSystem={initialUnitSystem}
            onUnitChange={setUnitSystem}
          />
        </div>

        {/* Actions bar */}
        <div className="px-6 md:px-8 py-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/recipes/${recipe.id}/edit`}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/recipes/${recipe.id}/print`} target="_blank">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </Link>
          </Button>
          <div className="flex-1" />
          <DeleteRecipeButton recipeId={recipe.id} />
        </div>
      </div>

      {/* Current stacks */}
      {currentStacks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-sm text-muted">In stacks:</span>
          {currentStacks.map((stack) => (
            <Chip key={stack.id} size="sm">
              {stack.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ingredients sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Ingredients
              <span className="text-sm font-normal text-muted">
                ({recipe.ingredients.length})
              </span>
            </h2>
            {recipe.ingredients.length === 0 ? (
              <p className="text-muted text-sm">No ingredients listed.</p>
            ) : (
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="flex items-start gap-3 text-foreground"
                  >
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="leading-relaxed">
                      {formatIngredient(ingredient, unitSystem)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Instructions main content */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            Instructions
            <span className="text-sm font-normal text-muted">
              ({recipe.instructions.length} steps)
            </span>
          </h2>
          {recipe.instructions.length === 0 ? (
            <p className="text-muted text-sm">No instructions listed.</p>
          ) : (
            <div className="space-y-4">
              {renderedInstructions.map((step) => (
                <StepCard
                  key={step.id}
                  stepNumber={step.stepNumber}
                  text={step.text}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Source URL */}
      {recipe.sourceUrl && (
        <div className="mt-8 p-4 bg-surface-2 rounded-xl text-sm">
          <span className="text-muted">Source: </span>
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {recipe.sourceUrl}
          </a>
        </div>
      )}

      {/* Stacks management */}
      <RecipeStacks
        recipeId={recipe.id}
        currentStacks={currentStacks}
        allStacks={allStacks}
      />

      {/* Export & Share */}
      <RecipeExportShare
        recipe={recipe}
        unitSystem={unitSystem}
        initialShareToken={initialShareToken}
        initialShareId={initialShareId}
      />
    </div>
  );
}
