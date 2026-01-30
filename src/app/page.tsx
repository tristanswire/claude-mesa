import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to recipes
  if (user) {
    redirect("/recipes");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <h1 className="text-4xl font-bold text-foreground">Mesa</h1>
        <p className="text-muted">
          Your personal cookbook with inline ingredient measurements.
        </p>
        <div className="flex flex-col space-y-4">
          <Button asChild className="w-full py-3">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button variant="outline" asChild className="w-full py-3">
            <Link href="/register">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
