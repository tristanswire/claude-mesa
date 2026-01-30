"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorFromUrl = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/recipes");
    router.refresh();
  }

  return (
    <>
      {(error || errorFromUrl) && (
        <div className="bg-error-subtle border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error || "Authentication error. Please try again."}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Email address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
        />

        <Button
          type="submit"
          disabled={loading}
          isLoading={loading}
          className="w-full py-3"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        {/* Auth card with terracotta header band */}
        <div className="bg-surface rounded-2xl shadow-lg overflow-hidden">
          {/* Header band */}
          <div className="bg-primary-subtle px-8 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface shadow-sm mb-4">
              <UtensilsCrossed className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted">
              Sign in to access your recipes
            </p>
          </div>

          {/* Form content */}
          <div className="px-8 py-8">
            <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
              <LoginForm />
            </Suspense>

            {/* Register link */}
            <p className="mt-6 text-center text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* Footer branding */}
        <p className="mt-6 text-center text-xs text-muted">
          Mesa — Your personal cookbook
        </p>
      </div>
    </div>
  );
}
