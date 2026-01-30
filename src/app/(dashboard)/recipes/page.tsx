import Link from "next/link";
import { listRecipes } from "@/lib/db/recipes";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { RecipeCard } from "@/components/recipe/RecipeCard";

export default async function RecipesPage() {
  const result = await listRecipes();

  return (
    <div>
      <PageHeader
        title="Recipes"
        description={
          result.success && result.data.length > 0
            ? `${result.data.length} recipe${result.data.length === 1 ? "" : "s"} in your collection`
            : undefined
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/recipes/import">Import</Link>
            </Button>
            <Button asChild>
              <Link href="/recipes/new">New Recipe</Link>
            </Button>
          </>
        }
      />

      {!result.success ? (
        <ErrorState
          title="Failed to load recipes"
          message={result.error}
          retry={{ label: "Try again", href: "/recipes" }}
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon="recipe"
          title="Your recipe collection is empty"
          description="Start building your collection by importing a recipe from your favorite website or creating one from scratch."
          action={{ label: "Import Recipe", href: "/recipes/import" }}
          secondaryAction={{ label: "Create from Scratch", href: "/recipes/new" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
