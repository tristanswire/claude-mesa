import { notFound } from "next/navigation";
import Link from "next/link";
import { getStackById } from "@/lib/db/stacks";
import { StackForm } from "@/components/stack/StackForm";
import { updateStackAction } from "@/lib/actions/stacks";

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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {result.error}
      </div>
    );
  }

  const stack = result.data;

  // Bind the stack ID to the action
  const boundAction = updateStackAction.bind(null, id);

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link
          href={`/stacks/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to stack
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit Stack</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <StackForm
          stack={stack}
          action={boundAction}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
