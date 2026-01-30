import Link from "next/link";
import { StackForm } from "@/components/stack/StackForm";
import { createStackAction } from "@/lib/actions/stacks";

export default function NewStackPage() {
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link
          href="/stacks"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to stacks
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Stack</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <StackForm action={createStackAction} submitLabel="Create Stack" />
      </div>
    </div>
  );
}
