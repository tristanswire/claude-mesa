import { ExternalLink } from "lucide-react";
import type { StoreItem } from "@/lib/db/store";
import { Badge } from "@/components/ui/Badge";

interface StoreItemCardProps {
  item: StoreItem;
  compact?: boolean;
}

export function StoreItemCard({ item, compact = false }: StoreItemCardProps) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
      {/* Product Image */}
      <div className={`relative bg-surface-2 ${compact ? "h-32" : "h-40"}`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted text-sm">No image</span>
          </div>
        )}
        {item.tag?.trim() && (
          <Badge variant="accent" className="absolute top-2 left-2 shadow-sm">
            {item.tag}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground line-clamp-2">
          {item.name}
        </h3>
        {item.description && !compact && (
          <p className="mt-1 text-sm text-muted line-clamp-2 flex-1">
            {item.description}
          </p>
        )}
        {item.description && compact && (
          <p className="mt-1 text-sm text-muted line-clamp-1 flex-1">
            {item.description}
          </p>
        )}

        {/* Buy Button */}
        <a
          href={item.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
        >
          Buy
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
