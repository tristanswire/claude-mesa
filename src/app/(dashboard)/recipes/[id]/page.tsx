import { notFound, redirect } from "next/navigation";
import { getRecipeById } from "@/lib/db/recipes";
import { getCachedPreferences } from "@/lib/db/cached";
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

  // Fetch recipe first to check auth status
  const recipeResult = await getRecipeById(id);

  // Handle auth and error cases before other fetches
  if (!recipeResult.success) {
    // Not authenticated - redirect to login
    if (recipeResult.error === "Not authenticated") {
      redirect(`/login?redirect=/recipes/${id}`);
    }

    // Recipe not found - show 404
    if (recipeResult.error === "Recipe not found") {
      notFound();
    }

    // Permission denied
    if (recipeResult.error.includes("permission")) {
      return (
        <ErrorState
          title="Access denied"
          message="You don't have permission to view this recipe."
          retry={{ label: "Back to recipes", href: "/recipes" }}
        />
      );
    }

    // Corrupted data
    if (
      recipeResult.error.includes("corrupted") ||
      recipeResult.error.includes("invalid")
    ) {
      return (
        <ErrorState
          title="Unable to display recipe"
          message="This recipe appears to have corrupted data. Please try editing it or contact support."
          retry={{ label: "Back to recipes", href: "/recipes" }}
        />
      );
    }

    // Generic error
    return (
      <ErrorState
        title="Unable to load recipe"
        message={recipeResult.error}
        retry={{ label: "Back to recipes", href: "/recipes" }}
      />
    );
  }

  // Recipe loaded successfully - fetch related data in parallel
  const [preferencesResult, allStacksResult, recipeStacksResult, shareResult] =
    await Promise.all([
      getCachedPreferences(), // Cached - deduplicates with layout fetch
      listStacks(),
      getStacksForRecipe(id),
      getActiveShareForRecipe(id),
    ]);

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
