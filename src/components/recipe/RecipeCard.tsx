import Link from "next/link";
import type { Recipe } from "@/lib/schemas";
import { RecipeCardImage } from "./RecipeImage";
import { Chip } from "@/components/ui/Badge";

interface RecipeCardProps {
  recipe: Recipe;
  stacks?: { id: string; name: string }[];
  href?: string;
}

export function RecipeCard({ recipe, stacks = [], href }: RecipeCardProps) {
  const linkHref = href || `/recipes/${recipe.id}`;

  // Format time display
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const totalTime =
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  return (
    <Link
      href={linkHref}
      className="group block bg-surface rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* 16:9 Image Area with error handling */}
      <RecipeCardImage src={recipe.imageUrl} title={recipe.title} />

      {/* Title overlay on image */}
      <div className="absolute top-0 left-0 right-0 aspect-video pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-white line-clamp-2 group-hover:text-white/90 transition-colors">
            {recipe.title}
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-muted line-clamp-2 mb-3">
            {recipe.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {recipe.servings}
            </span>
          )}
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatTime(totalTime)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {recipe.ingredients.length}
          </span>
        </div>

        {/* Stack chips */}
        {stacks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {stacks.slice(0, 3).map((stack) => (
              <Chip key={stack.id} size="sm">
                {stack.name}
              </Chip>
            ))}
            {stacks.length > 3 && (
              <Chip size="sm" variant="secondary">
                +{stacks.length - 3}
              </Chip>
            )}
          </div>
        )}

        {/* Updated date */}
        <p className="text-xs text-muted mt-3">
          Updated {new Date(recipe.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
