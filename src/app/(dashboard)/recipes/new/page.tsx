import Link from "next/link";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { createRecipeAction } from "@/lib/actions/recipes";
import { Button } from "@/components/ui/Button";
import { RECIPE_PAGE_MAX_WIDTH } from "@/components/recipe/RecipePageContainer";
import { canCreateRecipe } from "@/lib/db/entitlements";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";

export default async function NewRecipePage() {
  const limitCheck = await canCreateRecipe();

  // If user can't create recipes, show limit message
  if (!limitCheck.allowed) {
    return (
      <div className={RECIPE_PAGE_MAX_WIDTH}>
        {/* Top action bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors flex-shrink-0"
            aria-label="Back to recipes"
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
            <span className="font-medium hidden sm:inline">Back to recipes</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>

        {/* Limit reached message */}
        <div className="bg-surface rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            {limitCheck.isLapsedPlus ? "Your Plus plan has ended" : "Recipe Limit Reached"}
          </h1>
          <p className="text-muted mb-6 max-w-md mx-auto">
            {limitCheck.isLapsedPlus
              ? "All your existing recipes are safe. Renew Plus to keep saving new ones."
              : limitCheck.reason}
          </p>
          {limitCheck.code === "RECIPE_LIMIT_REACHED" && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {limitCheck.isLapsedPlus ? (
                <ManageBillingButton className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                  Renew Plus
                </ManageBillingButton>
              ) : (
                <Link href="/upgrade">
                  <Button variant="primary">
                    Upgrade Plan
                  </Button>
                </Link>
              )}
              <Link href="/recipes">
                <Button variant="outline">
                  View Recipes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show usage indicator if approaching limit
  const showUsageWarning = limitCheck.limit != null &&
    limitCheck.currentCount !== undefined &&
    limitCheck.currentCount >= limitCheck.limit * 0.8;

  return (
    <div className={RECIPE_PAGE_MAX_WIDTH}>
      {/* Top action bar - matches edit recipe page layout */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Left: Back link */}
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors flex-shrink-0"
          aria-label="Back to recipes"
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
          <span className="font-medium hidden sm:inline">Back to recipes</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Right: Create button */}
        <Button type="submit" form="recipe-form">
          Create Recipe
        </Button>
      </div>

      {/* Usage warning banner */}
      {showUsageWarning && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              You&apos;re using {limitCheck.currentCount} of {limitCheck.limit} recipes.{" "}
              <Link href="/upgrade" className="text-primary hover:underline font-medium">
                Upgrade
              </Link>{" "}
              for unlimited recipes.
            </p>
          </div>
        </div>
      )}

      {/* Page title */}
      <h1 className="text-2xl font-bold text-foreground mb-6">New Recipe</h1>

      {/* Recipe form - cards are rendered inside the form component */}
      <RecipeForm
        action={createRecipeAction}
        submitLabel="Create Recipe"
        formId="recipe-form"
        hideSubmitButton
      />
    </div>
  );
}
