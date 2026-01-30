"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  userEmail: string;
}

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/recipes" className="text-xl font-bold text-primary">
                Mesa
              </Link>
            </div>
            <nav className="ml-10 flex items-center space-x-1">
              <Link
                href="/recipes"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/recipes")
                    ? "bg-primary-subtle text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                Recipes
              </Link>
              <Link
                href="/stacks"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/stacks")
                    ? "bg-primary-subtle text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                Stacks
              </Link>
              <Link
                href="/settings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/settings")
                    ? "bg-primary-subtle text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted">{userEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
