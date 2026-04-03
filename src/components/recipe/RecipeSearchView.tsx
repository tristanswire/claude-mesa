"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { parseRecipeFromDb } from "@/lib/validation/recipes";
import type { Recipe } from "@/lib/schemas";

interface RecipeSearchViewProps {
  initialRecipes: Recipe[];
}

export function RecipeSearchView({ initialRecipes }: RecipeSearchViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>(initialRecipes);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(initialRecipes);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .textSearch("title", query.trim(), { config: "english", type: "plain" })
        .order("updated_at", { ascending: false });

      if (!error && data) {
        const parsed: Recipe[] = [];
        for (const row of data) {
          const result = parseRecipeFromDb(row);
          if (result.success) parsed.push(result.data);
        }
        setResults(parsed);
      }

      setIsSearching(false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, initialRecipes]);

  return (
    <>
      {/* Search input */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {isSearching ? (
            <svg
              className="h-4 w-4 text-muted animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-9 pr-9 py-3 text-foreground bg-surface border border-input rounded-lg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Recipe grid or empty state */}
      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">
            No recipes found for &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </>
  );
}
