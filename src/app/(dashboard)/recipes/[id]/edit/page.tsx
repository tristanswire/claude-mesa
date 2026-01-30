import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/db/recipes";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { RecipeImageUpload } from "@/components/recipe/RecipeImageUpload";
import { DeleteRecipeSection } from "@/components/recipe/DeleteRecipeSection";
import { updateRecipeAction } from "@/lib/actions/recipes";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const result = await getRecipeById(id);

  if (!result.success) {
    if (result.error === "Recipe not found") {
      notFound();
    }
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {result.error}
      </div>
    );
  }

  const recipe = result.data;

  // Bind the recipe ID to the action
  const boundAction = updateRecipeAction.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/recipes/${id}`}
          className="text-sm text-muted hover:text-foreground transition-colors mb-2 inline-block"
        >
          &larr; Back to recipe
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Recipe</h1>
      </div>

      {/* Image upload section */}
      <div className="bg-surface rounded-xl p-6 mb-6">
        <RecipeImageUpload recipeId={id} currentImageUrl={recipe.imageUrl} />
      </div>

      {/* Recipe form */}
      <div className="bg-surface rounded-xl p-6">
        <RecipeForm
          recipe={recipe}
          action={boundAction}
          submitLabel="Save Changes"
        />
      </div>

      {/* Danger zone - Delete */}
      <div className="mt-8">
        <DeleteRecipeSection recipeId={id} recipeTitle={recipe.title} />
      </div>
    </div>
  );
}
