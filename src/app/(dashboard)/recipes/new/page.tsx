import { RecipeForm } from "@/components/recipe/RecipeForm";
import { createRecipeAction } from "@/lib/actions/recipes";

export default function NewRecipePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Recipe</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <RecipeForm action={createRecipeAction} submitLabel="Create Recipe" />
      </div>
    </div>
  );
}
