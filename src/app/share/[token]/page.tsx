import Link from "next/link";
import { getRecipeByShareToken } from "@/lib/db/recipe-shares";
import { RecipePrintView } from "@/components/recipe/RecipePrintView";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  const result = await getRecipeByShareToken(token);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-surface shadow-lg rounded-xl p-8">
            <div className="w-16 h-16 bg-error-subtle rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-error"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">
              Recipe Not Available
            </h1>
            <p className="text-muted mb-6">
              {result.error || "This share link is invalid or has been revoked."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Go to Mesa Recipe App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { recipe } = result.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar - hidden when printing */}
      <div className="print:hidden bg-surface-2 border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-muted">
            Shared recipe from Mesa
          </span>
          <Link
            href="/"
            className="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Get Mesa Recipe App
          </Link>
        </div>
      </div>

      <RecipePrintView
        recipe={recipe}
        unitSystem="original"
        showPrintButton={true}
        showAttribution={true}
      />
    </div>
  );
}
