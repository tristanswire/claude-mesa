/**
 * Placeholder image for recipes without photos.
 *
 * Theme-aware: adapts to light/dark mode using CSS variables.
 * Uses warm hues derived from recipe title for visual variety.
 */

interface RecipePlaceholderImageProps {
  title?: string;
  className?: string;
}

export function RecipePlaceholderImage({
  title,
  className = "",
}: RecipePlaceholderImageProps) {
  // Generate a consistent warm hue based on title
  const getWarmHue = (str: string) => {
    if (!str) return 16; // terracotta hue
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Map to warm hues: 0-45 (reds, oranges, yellows) or 340-360 (warm reds)
    const hue = Math.abs(hash % 60);
    return hue > 45 ? 340 + (hue - 45) : hue;
  };

  const hue = getWarmHue(title || "");

  return (
    <div
      className={`relative flex items-center justify-center bg-surface-2 ${className}`}
      style={
        {
          "--placeholder-hue": hue,
        } as React.CSSProperties
      }
    >
      {/* Gradient overlay - uses CSS to adapt to light/dark mode */}
      <div
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          background: `linear-gradient(135deg,
            hsl(var(--placeholder-hue), 35%, 85%) 0%,
            hsl(calc(var(--placeholder-hue) + 20), 30%, 78%) 100%)`,
        }}
      />
      {/* Dark mode gradient overlay */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-50"
        style={{
          background: `linear-gradient(135deg,
            hsl(var(--placeholder-hue), 25%, 25%) 0%,
            hsl(calc(var(--placeholder-hue) + 20), 20%, 20%) 100%)`,
        }}
      />

      {/* Cookbook icon */}
      <svg
        className="relative w-12 h-12 text-foreground/20"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    </div>
  );
}
