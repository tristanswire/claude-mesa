"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateProfileNameAction } from "@/lib/actions/preferences";

interface ProfileEditorProps {
  initialFirstName: string;
  initialLastName: string;
}

export function ProfileEditor({
  initialFirstName,
  initialLastName,
}: ProfileEditorProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const hasChanges =
    firstName !== initialFirstName || lastName !== initialLastName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateProfileNameAction(firstName, lastName);
      if (result.success) {
        setSuccess(true);
        // Refresh to update header
        router.refresh();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to update profile");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-error-subtle text-error text-sm rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-success-subtle text-success text-sm rounded-lg">
          Profile updated successfully
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Jane"
          required
          disabled={isPending}
        />
        <Input
          label="Last name"
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe"
          disabled={isPending}
        />
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={!hasChanges || isPending}
        isLoading={isPending}
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
