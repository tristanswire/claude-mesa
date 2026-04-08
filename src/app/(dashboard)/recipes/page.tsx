import Link from "next/link";
import { listRecipes } from "@/lib/db/recipes";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { SampleRecipeButton } from "@/components/recipe/SampleRecipeButton";
import { RecipeSearchView } from "@/components/recipe/RecipeSearchView";

export default async function RecipesPage() {
  const result = await listRecipes();

  // Show enhanced empty state for new users
  if (result.success && result.data.length === 0) {
    return (
      <div>
        <PageHeader title="Recipes" />

        {/* Hero empty state */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Decorative header */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-12">
            <div className="max-w-xl">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Start your recipe collection
              </h2>
              <p className="text-muted text-lg mb-8">
                Import recipes from any website in seconds. Just paste the URL and we&apos;ll extract everything for you.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link href="/recipes/import" className="gap-2">
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Import from URL
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/recipes/new">Create from scratch</Link>
                </Button>
              </div>

              {/* Sample recipe option */}
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-sm text-muted mb-3">
                  Just want to explore? Try a sample recipe first.
                </p>
                <SampleRecipeButton />
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="p-6 md:p-8 border-t border-border">
            <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-4">
              How it works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Paste a recipe URL</p>
                  <p className="text-sm text-muted">From any recipe website</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">We extract it</p>
                  <p className="text-sm text-muted">Ingredients, steps, and more</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Organize into collections</p>
                  <p className="text-sm text-muted">Group by meal, occasion, or mood</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <Link href="/recipes/new">New</Link>
            </Button>
            <Button asChild>
              <Link href="/recipes/import" className="gap-2">
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Import
              </Link>
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
      ) : (
        <RecipeSearchView initialRecipes={result.data} />
      )}
    </div>
  );
}
