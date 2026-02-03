import { getStoreItemsForRecipe } from "@/lib/db/store";
import { StoreItemCard } from "@/components/store/StoreItemCard";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

interface ShopThisRecipeProps {
  recipeId: string;
}

export async function ShopThisRecipe({ recipeId }: ShopThisRecipeProps) {
  const items = await getStoreItemsForRecipe(recipeId);

  // Don't render if no items mapped
  if (items.length === 0) {
    return null;
  }

  // Limit to 5 items max
  const displayItems = items.slice(0, 5);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Shop this recipe
        </h2>
        <Link
          href="/store"
          className="text-sm text-primary hover:text-primary-hover transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Horizontal scroll on mobile, grid on larger screens */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible">
        {displayItems.map((item) => (
          <div key={item.id} className="flex-shrink-0 w-40 sm:w-auto">
            <StoreItemCard item={item} compact />
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Affiliate links may earn a small commission.
      </p>
    </section>
  );
}
