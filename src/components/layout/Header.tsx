"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";

interface HeaderProps {
  userEmail: string;
  firstName?: string | null;
}

export function Header({ userEmail, firstName }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const displayName = firstName?.trim() || userEmail;

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
        <div className="flex items-center justify-between h-16">
          {/* Logo - left */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/recipes" className="text-xl font-bold text-primary">
              mesa
            </Link>
          </div>

          {/* Nav + User menu - right */}
          <div className="flex items-center gap-1">
            <nav className="flex items-center gap-1 mr-2">
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
                href="/store"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/store")
                    ? "bg-primary-subtle text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                Store
              </Link>
            </nav>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="User menu"
                >
                  <span className="max-w-[150px] truncate">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 w-full"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
