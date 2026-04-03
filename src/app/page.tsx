import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/recipes");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero zone */}
      <div style={{ background: "#fffbf4" }}>
        {/* Nav */}
        <header className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto w-full">
          <span className="text-xl font-bold text-primary">Mesa</span>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
        </header>

        {/* Hero */}
        <main className="flex flex-col items-center px-6 pt-16 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight max-w-xl">
            Every meal.<br />Everyone together.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
            Mesa helps busy parents plan meals, save recipes, and bring the family to the table — without the chaos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-[160px]">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-[160px]">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </main>
      </div>

      {/* Features zone */}
      <section style={{ background: "#fffbf4" }} className="flex-1 px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div
            className="flex flex-col items-center gap-2 text-center"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "32px 24px" }}
          >
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M2 8h8M2 12h5" stroke="#b34519" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Save any recipe</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Import from any URL or paste from anywhere. Your recipes, organized.
            </p>
          </div>
          <div
            className="flex flex-col items-center gap-2 text-center"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "32px 24px" }}
          >
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="#b34519" strokeWidth="1.75"/>
                <path d="M8 5v3l2 1.5" stroke="#b34519" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Cook with confidence</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ingredients scale automatically. No more mental math mid-cook.
            </p>
          </div>
          <div
            className="flex flex-col items-center gap-2 text-center"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "32px 24px" }}
          >
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 8 4 8s4-5 4-8c0-2.2-1.8-4-4-4z" stroke="#b34519" strokeWidth="1.75" strokeLinejoin="round"/>
                <circle cx="8" cy="6" r="1.25" fill="#b34519"/>
              </svg>
            </div>
            <h3 className="font-semibold text-foreground">Gather together</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plan meals for the week. Feed your family without the stress.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs text-muted-foreground border-t border-border" style={{ background: "#fffbf4" }}>
        Mesa — Made for families. &copy; 2026
      </footer>
    </div>
  );
}
