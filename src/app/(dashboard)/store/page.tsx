import { getStoreItemsByCategory } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { StoreItemCard } from "@/components/store/StoreItemCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function StorePage() {
  const categories = await getStoreItemsByCategory();

  return (
    <div>
      <PageHeader
        title="Store"
        description="Kitchen essentials I use and recommend"
      />

      {categories.length === 0 ? (
        <EmptyState
          icon="store"
          title="Store is being stocked"
          description="We're curating the best kitchen essentials. Check back soon, or browse your recipes in the meantime."
          action={{ label: "Browse Recipes", href: "/recipes" }}
        />
      ) : (
        <div className="space-y-10">
          {categories.map(({ category, items }) => (
            <section key={category}>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <StoreItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Disclosure */}
      <p className="mt-10 text-xs text-muted text-center">
        Some links are affiliate links. I may earn a small commission at no extra cost to you.
      </p>
    </div>
  );
}
