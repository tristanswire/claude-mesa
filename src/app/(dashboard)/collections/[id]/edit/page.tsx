import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionById } from "@/lib/db/collections";
import { CollectionForm } from "@/components/collection/CollectionForm";
import { updateCollectionAction } from "@/lib/actions/collections";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card, CardContent } from "@/components/ui/Card";

interface EditCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { id } = await params;

  const result = await getCollectionById(id);

  if (!result.success) {
    if (result.error === "Collection not found") {
      notFound();
    }
    return (
      <ErrorState
        title="Failed to load collection"
        message={result.error}
        retry={{ label: "Go back to collections", href: "/collections" }}
      />
    );
  }

  const collection = result.data;

  // Bind the collection ID to the action
  const boundAction = updateCollectionAction.bind(null, id);

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/collections/${id}`}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; Back to collection
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Edit Collection</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <CollectionForm
            collection={collection}
            action={boundAction}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
