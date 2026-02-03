import Link from "next/link";
import { StackForm } from "@/components/stack/StackForm";
import { createStackAction } from "@/lib/actions/stacks";
import { Card, CardContent } from "@/components/ui/Card";

export default function NewStackPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <Link
          href="/stacks"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          &larr; Back to stacks
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">New Stack</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <StackForm action={createStackAction} submitLabel="Create Stack" />
        </CardContent>
      </Card>
    </div>
  );
}
