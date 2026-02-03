import { notFound } from "next/navigation";
import Link from "next/link";
import { getStackById } from "@/lib/db/stacks";
import { StackForm } from "@/components/stack/StackForm";
import { updateStackAction } from "@/lib/actions/stacks";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card, CardContent } from "@/components/ui/Card";

interface EditStackPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStackPage({ params }: EditStackPageProps) {
  const { id } = await params;

  const result = await getStackById(id);

  if (!result.success) {
    if (result.error === "Stack not found") {
      notFound();
    }
    return (
      <ErrorState
        title="Failed to load stack"
        message={result.error}
        retry={{ label: "Go back to stacks", href: "/stacks" }}
      />
    );
  }

  const stack = result.data;

  // Bind the stack ID to the action
  const boundAction = updateStackAction.bind(null, id);

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/stacks/${id}`}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; Back to stack
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Edit Stack</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <StackForm
            stack={stack}
            action={boundAction}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
