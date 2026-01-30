import { notFound } from "next/navigation";
import Link from "next/link";
import { getStackById, listRecipesForStack } from "@/lib/db/stacks";
import { DeleteStackButton } from "@/components/stack/DeleteStackButton";
import { RemoveFromStackButton } from "@/components/stack/RemoveFromStackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { RecipeCard } from "@/components/recipe/RecipeCard";

interface StackDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StackDetailPage({ params }: StackDetailPageProps) {
  const { id } = await params;

  const [stackResult, recipesResult] = await Promise.all([
    getStackById(id),
    listRecipesForStack(id),
  ]);

  if (!stackResult.success) {
    if (stackResult.error === "Stack not found") {
      notFound();
    }
    return (
      <ErrorState
        title="Failed to load stack"
        message={stackResult.error}
        retry={{ label: "Go back to stacks", href: "/stacks" }}
      />
    );
  }

  const stack = stackResult.data;
  const recipes = recipesResult.success ? recipesResult.data : [];

  return (
    <div>
      <PageHeader
        title={stack.name}
        description={stack.description}
        backLink={{ href: "/stacks", label: "Back to stacks" }}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href={`/stacks/${stack.id}/edit`}>Edit</Link>
            </Button>
            <DeleteStackButton stackId={stack.id} />
          </div>
        }
      />

      {/* Recipe count banner */}
      <div className="bg-surface rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <svg
              className="w-5 h-5"
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
          <div>
            <p className="font-medium text-foreground">
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </p>
            <p className="text-sm text-muted">in this collection</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/recipes">Browse Recipes</Link>
        </Button>
      </div>

      {recipes.length === 0 ? (
        <EmptyState
          icon="recipe"
          title="No recipes in this stack"
          description="Add recipes to this collection from any recipe's detail page."
          action={{ label: "Browse Recipes", href: "/recipes" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="relative group">
              <RecipeCard recipe={recipe} />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <RemoveFromStackButton
                  recipeId={recipe.id}
                  stackId={stack.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
