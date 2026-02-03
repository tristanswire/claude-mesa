import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/db/recipes";
import { getUserPreferences } from "@/lib/db/user-preferences";
import { listStacks, getStacksForRecipe } from "@/lib/db/stacks";
import { getActiveShareForRecipe } from "@/lib/db/recipe-shares";
import { RecipeDetailView } from "@/components/recipe/RecipeDetailView";
import { ShopThisRecipe } from "@/components/recipe/ShopThisRecipe";
import { ErrorState } from "@/components/ui/ErrorState";
import { RECIPE_PAGE_MAX_WIDTH } from "@/components/recipe/RecipePageContainer";

interface RecipeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { id } = await params;

  // Fetch recipe, user preferences, stacks, and share data in parallel
  const [recipeResult, preferencesResult, allStacksResult, recipeStacksResult, shareResult] =
    await Promise.all([
      getRecipeById(id),
      getUserPreferences(),
      listStacks(),
      getStacksForRecipe(id),
      getActiveShareForRecipe(id),
    ]);

  if (!recipeResult.success) {
    if (recipeResult.error === "Recipe not found") {
      notFound();
    }
    // Handle corrupted data or other errors gracefully
    return (
      <ErrorState
        title="Unable to display recipe"
        message={
          recipeResult.error.includes("corrupted") ||
          recipeResult.error.includes("invalid")
            ? "This recipe appears to have corrupted data. Please try editing it or contact support."
            : recipeResult.error
        }
        retry={{ label: "Back to recipes", href: "/recipes" }}
      />
    );
  }

  const recipe = recipeResult.data;
  const unitSystem = preferencesResult.success
    ? preferencesResult.data.preferredUnitSystem
    : "original";
  const allStacks = allStacksResult.success ? allStacksResult.data : [];
  const currentStacks = recipeStacksResult.success ? recipeStacksResult.data : [];
  const activeShare = shareResult.success ? shareResult.data : null;

  return (
    <>
      <RecipeDetailView
        recipe={recipe}
        initialUnitSystem={unitSystem}
        allStacks={allStacks}
        currentStacks={currentStacks}
        initialShareToken={activeShare?.token}
        initialShareId={activeShare?.id}
      />
      <div className={RECIPE_PAGE_MAX_WIDTH}>
        <ShopThisRecipe recipeId={recipe.id} />
      </div>
    </>
  );
}
