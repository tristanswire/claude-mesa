import Link from "next/link";
import { listCollections } from "@/lib/db/collections";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function CollectionsPage() {
  const result = await listCollections();

  return (
    <div>
      <PageHeader
        title="Collections"
        description={
          result.success && result.data.length > 0
            ? `${result.data.length} collection${result.data.length === 1 ? "" : "s"} to organize your recipes`
            : undefined
        }
        actions={
          <Button asChild>
            <Link href="/collections/new">New Collection</Link>
          </Button>
        }
      />

      {!result.success ? (
        <ErrorState
          title="Failed to load collections"
          message={result.error}
          retry={{ label: "Try again", href: "/collections" }}
        />
      ) : result.data.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-8 md:p-12">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Organize with collections
              </h2>
              <p className="text-muted text-lg mb-6">
                Collections help you group recipes by theme, meal type, or occasion. Think of them like playlists for your recipes.
              </p>

              {/* Example collections */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  Weeknight Dinners
                </span>
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  Meal Prep
                </span>
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  Holiday Favorites
                </span>
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  Quick &amp; Easy
                </span>
              </div>

              <Button size="lg" asChild>
                <Link href="/collections/new" className="gap-2">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First Collection
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group block bg-surface rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {/* Collection icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {collection.name}
              </h2>

              {collection.description && (
                <p className="text-sm text-muted line-clamp-2 mb-3">
                  {collection.description}
                </p>
              )}

              <p className="text-sm text-muted">
                {collection.recipeCount} {collection.recipeCount === 1 ? "recipe" : "recipes"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
