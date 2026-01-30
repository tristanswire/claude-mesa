"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/lib/actions/stacks";

interface StackFormProps {
  stack?: {
    id: string;
    name: string;
    description?: string;
  };
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}

export function StackForm({ stack, action, submitLabel }: StackFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    success: true,
  });

  return (
    <form action={formAction} className="space-y-6">
      {!state.success && state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={stack?.name}
          placeholder="e.g., Breakfast, Quick Dinners, Holiday Favorites"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={stack?.description || ""}
          placeholder="Optional description for this stack"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Link
          href="/stacks"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
