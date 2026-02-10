import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRecipeById } from "@/lib/db/recipes";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { RecipeImageUpload } from "@/components/recipe/RecipeImageUpload";
import { DeleteRecipeButton } from "@/components/recipe/DeleteRecipeButton";
import { updateRecipeAction } from "@/lib/actions/recipes";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { RECIPE_PAGE_MAX_WIDTH } from "@/components/recipe/RecipePageContainer";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const result = await getRecipeById(id);

  if (!result.success) {
    // Not authenticated - redirect to login
    if (result.error === "Not authenticated") {
      redirect(`/login?redirect=/recipes/${id}/edit`);
    }

    // Recipe not found - show 404
    if (result.error === "Recipe not found") {
      notFound();
    }

    // Permission denied or other errors
    return (
      <div className={RECIPE_PAGE_MAX_WIDTH}>
        <ErrorState
          title={result.error.includes("permission") ? "Access denied" : "Unable to edit recipe"}
          message={result.error}
          retry={{ label: "Back to recipes", href: "/recipes" }}
        />
      </div>
    );
  }

  const recipe = result.data;

  // Bind the recipe ID to the action
  const boundAction = updateRecipeAction.bind(null, id);

  return (
    <div className={RECIPE_PAGE_MAX_WIDTH}>
      {/* Top action bar - matches single recipe page layout */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Left: Back link */}
        <Link
          href={`/recipes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors flex-shrink-0"
          aria-label="Back to recipe"
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
          <span className="font-medium hidden sm:inline">Back to recipe</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DeleteRecipeButton recipeId={id} recipeTitle={recipe.title} />
          <Button type="submit" form="recipe-form">
            Save Changes
          </Button>
        </div>
      </div>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-foreground mb-6">Edit Recipe</h1>

      {/* Recipe form - cards are rendered inside the form component */}
      <RecipeForm
        recipe={recipe}
        action={boundAction}
        submitLabel="Save Changes"
        formId="recipe-form"
        hideSubmitButton
        imageUploadSlot={
          <RecipeImageUpload recipeId={id} currentImageUrl={recipe.imageUrl} />
        }
      />
    </div>
  );
}
