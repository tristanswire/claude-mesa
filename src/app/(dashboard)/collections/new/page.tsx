import Link from "next/link";
import { CollectionForm } from "@/components/collection/CollectionForm";
import { createCollectionAction } from "@/lib/actions/collections";
import { Card, CardContent } from "@/components/ui/Card";

export default function NewCollectionPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link
          href="/collections"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; Back to collections
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">New Collection</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CollectionForm action={createCollectionAction} submitLabel="Create Collection" />
        </CardContent>
      </Card>
    </div>
  );
}
