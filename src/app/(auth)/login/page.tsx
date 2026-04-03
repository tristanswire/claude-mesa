"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { publicEnv } from "@/lib/env";

type OAuthProvider = "google" | "apple";

const errorMessages: Record<string, string> = {
  auth_callback_error:
    "We couldn\u2019t complete sign-in. Please try again or use a different method.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorFromUrl = searchParams.get("error");

  async function handleOAuth(provider: OAuthProvider) {
    setError(null);
    setOauthLoading(provider);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

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

  const isDisabled = loading || oauthLoading !== null;

  return (
    <>
      {(error || errorFromUrl) && (
        <div className="bg-error-subtle border border-error/20 text-error px-4 py-3 rounded-lg text-sm">
          {error ||
            (errorFromUrl && errorMessages[errorFromUrl]) ||
            "Authentication error. Please try again."}
        </div>
      )}

      {/* OAuth buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full py-3"
          disabled={isDisabled}
          isLoading={oauthLoading === "google"}
          leftIcon={
            oauthLoading !== "google" ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            ) : undefined
          }
          onClick={() => handleOAuth("google")}
        >
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full py-3"
          disabled={isDisabled}
          isLoading={oauthLoading === "apple"}
          leftIcon={
            oauthLoading !== "apple" ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            ) : undefined
          }
          onClick={() => handleOAuth("apple")}
        >
          Continue with Apple
        </Button>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface px-2 text-muted">or</span>
        </div>
      </div>

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
          disabled={isDisabled}
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
