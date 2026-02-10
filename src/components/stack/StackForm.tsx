"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
        <div className="bg-error-subtle border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
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
          className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={stack?.description || ""}
          placeholder="Optional description for this stack"
          className="mt-1 block w-full px-3 py-2 border border-border rounded-lg bg-surface text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={stack ? `/stacks/${stack.id}` : "/stacks"}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending} isLoading={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
