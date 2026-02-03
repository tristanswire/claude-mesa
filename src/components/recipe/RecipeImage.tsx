"use client";

/**
 * Recipe image component with error handling and fallback.
 *
 * Features:
 * - Uses Next.js Image for optimization
 * - Falls back to placeholder if image fails to load
 * - Shows placeholder during loading
 * - Handles missing/broken URLs gracefully
 */

import { useState } from "react";
import Image from "next/image";
import { RecipePlaceholderImage } from "./RecipePlaceholderImage";

interface RecipeImageProps {
  /** Image URL to display */
  src: string | null | undefined;
  /** Recipe title (for alt text and placeholder color) */
  title: string;
  /** Whether this is a priority image (above the fold) */
  priority?: boolean;
  /** Image sizes for responsive loading */
  sizes?: string;
  /** Additional CSS classes */
  className?: string;
  /** Aspect ratio class (e.g., "aspect-video", "aspect-[21/9]") */
  aspectRatio?: string;
}

export function RecipeImage({
  src,
  title,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className = "",
  aspectRatio = "aspect-video",
}: RecipeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no src or error occurred, show placeholder
  if (!src || hasError) {
    return (
      <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
        <RecipePlaceholderImage
          title={title}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className}`}>
      {/* Show placeholder while loading */}
      {isLoading && (
        <RecipePlaceholderImage
          title={title}
          className="absolute inset-0 w-full h-full"
        />
      )}

      <Image
        src={src}
        alt={title}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}

/**
 * Recipe image for cards (16:9 aspect ratio with overlay gradient).
 */
export function RecipeCardImage({
  src,
  title,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
}: {
  src: string | null | undefined;
  title: string;
  sizes?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative aspect-video overflow-hidden">
      {/* Placeholder (always rendered behind) */}
      {(!src || hasError || isLoading) && (
        <RecipePlaceholderImage
          title={title}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Actual image */}
      {src && !hasError && (
        <Image
          src={src}
          alt={title}
          fill
          sizes={sizes}
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    </div>
  );
}

/**
 * Recipe image for detail view (21:9 hero aspect ratio).
 */
export function RecipeHeroImage({
  src,
  title,
}: {
  src: string | null | undefined;
  title: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative aspect-[21/9] overflow-hidden">
      {/* Placeholder (always rendered behind) */}
      {(!src || hasError || isLoading) && (
        <RecipePlaceholderImage
          title={title}
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Actual image */}
      {src && !hasError && (
        <Image
          src={src}
          alt={title}
          fill
          priority
          sizes="(max-width: 896px) 100vw, 896px"
          className={`object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
    </div>
  );
}
