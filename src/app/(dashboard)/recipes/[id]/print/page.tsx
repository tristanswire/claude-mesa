import { notFound } from "next/navigation";
import Link from "next/link";
import { getRecipeById } from "@/lib/db/recipes";
import { getUserPreferences } from "@/lib/db/user-preferences";
import { RecipePrintView } from "@/components/recipe/RecipePrintView";
import { ErrorState } from "@/components/ui/ErrorState";

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintPage({ params }: PrintPageProps) {
  const { id } = await params;

  const [recipeResult, preferencesResult] = await Promise.all([
    getRecipeById(id),
    getUserPreferences(),
  ]);

  if (!recipeResult.success) {
    if (recipeResult.error === "Recipe not found") {
      notFound();
    }
    return (
      <ErrorState
        title="Unable to display recipe"
        message={recipeResult.error}
        retry={{ label: "Back to recipes", href: "/recipes" }}
      />
    );
  }

  const recipe = recipeResult.data;
  const unitSystem = preferencesResult.success
    ? preferencesResult.data.preferredUnitSystem
    : "original";

  return (
    <div className="min-h-screen bg-white">
      {/* Back link - hidden when printing */}
      <div className="print:hidden max-w-3xl mx-auto px-6 pt-4">
        <Link
          href={`/recipes/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to recipe
        </Link>
      </div>

      <RecipePrintView
        recipe={recipe}
        unitSystem={unitSystem}
        showPrintButton={true}
        showAttribution={false}
      />
    </div>
  );
}
