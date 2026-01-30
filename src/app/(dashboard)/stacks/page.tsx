import Link from "next/link";
import { listStacks } from "@/lib/db/stacks";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";

export default async function StacksPage() {
  const result = await listStacks();

  return (
    <div>
      <PageHeader
        title="Stacks"
        description={
          result.success && result.data.length > 0
            ? `${result.data.length} collection${result.data.length === 1 ? "" : "s"} to organize your recipes`
            : undefined
        }
        actions={
          <Button asChild>
            <Link href="/stacks/new">New Stack</Link>
          </Button>
        }
      />

      {!result.success ? (
        <ErrorState
          title="Failed to load stacks"
          message={result.error}
          retry={{ label: "Try again", href: "/stacks" }}
        />
      ) : result.data.length === 0 ? (
        <EmptyState
          icon="stack"
          title="Organize with stacks"
          description="Create collections to group your recipes—like 'Weeknight Dinners', 'Breakfast Ideas', or 'Holiday Favorites'."
          action={{ label: "Create Your First Stack", href: "/stacks/new" }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data.map((stack) => (
            <Link
              key={stack.id}
              href={`/stacks/${stack.id}`}
              className="group block bg-surface rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {/* Stack icon */}
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
                {stack.name}
              </h2>

              {stack.description && (
                <p className="text-sm text-muted line-clamp-2 mb-3">
                  {stack.description}
                </p>
              )}

              <p className="text-sm text-muted">
                {stack.recipeCount} {stack.recipeCount === 1 ? "recipe" : "recipes"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
