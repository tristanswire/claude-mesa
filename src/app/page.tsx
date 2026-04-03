import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FileText, Clock, BookOpen, Scale, Users } from "lucide-react";

const CONTAINER = "mx-auto w-full px-6" as const;
const MAX_W = { maxWidth: "1024px" } as const;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/recipes");
  }

  return (
    <div className="flex flex-col" style={{ background: "#fffbf4", fontFamily: "var(--font-dm-sans)" }}>

      {/* ─── Section 1: Nav ─────────────────────────────────────────── */}
      <header style={{ background: "#fffbf4" }}>
        <div className={`${CONTAINER} flex items-center justify-between py-5`} style={MAX_W}>
          <span className="text-xl font-bold" style={{ color: "#b34519" }}>Mesa</span>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      {/* ─── Section 2: Hero ────────────────────────────────────────── */}
      <section className={`${CONTAINER} flex flex-col items-center text-center`} style={{ ...MAX_W, paddingTop: "80px", paddingBottom: "64px" }}>
        <h1 className="font-bold text-foreground leading-tight" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", maxWidth: "640px" }}>
          Dinner shouldn&apos;t be this hard.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed" style={{ maxWidth: "480px" }}>
          Mesa helps busy families save recipes, plan meals, and bring everyone to the table — without the chaos.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center mt-8" style={{ gap: "12px", width: "100%", maxWidth: "280px" }}>
          <Button asChild size="lg" className="w-full">
            <Link href="/register">Start for Free</Link>
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:underline transition-colors">
            Already have an account? Sign in
          </Link>
        </div>

        {/* PLACEHOLDER: Hero product screenshot */}
        {/* Replace with: <Image src="/public/images/mesa-hero-screenshot.png" ... /> */}
        <div
          className="mt-12 w-full flex items-center justify-center rounded-2xl"
          style={{
            background: "#f0e0d0",
            maxWidth: "860px",
            height: "clamp(240px, 40vw, 400px)",
            borderRadius: "16px",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "#b34519", opacity: 0.6 }}>
            [Product screenshot — replace with real screenshot]
            {/* Drop file at: /public/images/mesa-hero-screenshot.png */}
          </span>
        </div>
      </section>

      {/* ─── Section 3: Problem ─────────────────────────────────────── */}
      <section className={`${CONTAINER}`} style={{ ...MAX_W, paddingTop: "64px", paddingBottom: "64px" }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-10" style={{ color: "#b34519" }}>
          SOUND FAMILIAR?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Problem card 1 */}
          <div
            className="flex flex-col items-center text-center gap-4"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "32px" }}
          >
            <div className="flex items-center justify-center rounded-xl" style={{ width: "48px", height: "48px", background: "rgba(179,69,25,0.08)" }}>
              <FileText size={22} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Your recipes are everywhere.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Saved in browser tabs. Screenshotted on your phone. Written on paper you can&apos;t find. You have great recipes — you just can&apos;t find them when you need them.
            </p>
          </div>
          {/* Problem card 2 */}
          <div
            className="flex flex-col items-center text-center gap-4"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "32px" }}
          >
            <div className="flex items-center justify-center rounded-xl" style={{ width: "48px", height: "48px", background: "rgba(179,69,25,0.08)" }}>
              <Clock size={22} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-lg text-foreground">What&apos;s for dinner?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every. Single. Night. The mental load of figuring out meals for a busy family is exhausting. There has to be a better way.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Features ────────────────────────────────────── */}
      <section className={`${CONTAINER}`} style={{ ...MAX_W, paddingTop: "64px", paddingBottom: "64px" }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-10" style={{ color: "#b34519" }}>
          EVERYTHING IN ONE PLACE
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div
            className="flex flex-col items-center gap-3 text-center"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "32px 24px" }}
          >
            <div className="flex items-center justify-center rounded-xl" style={{ width: "44px", height: "44px", background: "rgba(179,69,25,0.08)" }}>
              <BookOpen size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-foreground">Save any recipe</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Import from any URL, paste from anywhere, or create from scratch. Your recipes, beautifully organized and always findable.
            </p>
          </div>
          {/* Feature 2 */}
          <div
            className="flex flex-col items-center gap-3 text-center"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "32px 24px" }}
          >
            <div className="flex items-center justify-center rounded-xl" style={{ width: "44px", height: "44px", background: "rgba(179,69,25,0.08)" }}>
              <Scale size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-foreground">Cook with confidence</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ingredients scale automatically. No more mental math mid-cook. Just tap and cook.
            </p>
          </div>
          {/* Feature 3 */}
          <div
            className="flex flex-col items-center gap-3 text-center"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "32px 24px" }}
          >
            <div className="flex items-center justify-center rounded-xl" style={{ width: "44px", height: "44px", background: "rgba(179,69,25,0.08)" }}>
              <Users size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-foreground">Gather together</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plan meals for the week. Feed your family without the stress. Dinner time becomes something everyone looks forward to.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 5: Demo Video Placeholder ──────────────────────── */}
      <section className={`${CONTAINER} flex flex-col items-center`} style={{ ...MAX_W, paddingTop: "64px", paddingBottom: "64px" }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-10 text-muted-foreground">
          SEE IT IN ACTION
        </p>
        {/* PLACEHOLDER: Demo video */}
        {/* Replace with: <video src="/public/videos/mesa-demo.mp4" autoPlay muted loop playsInline /> */}
        {/* Or embed a Loom/YouTube iframe here */}
        <div
          className="w-full flex items-center justify-center"
          style={{
            background: "#f0e0d0",
            borderRadius: "16px",
            maxWidth: "860px",
            height: "clamp(280px, 45vw, 480px)",
          }}
        >
          <span className="text-sm font-medium" style={{ color: "#b34519", opacity: 0.6 }}>
            [Demo video — replace with real product demo]
            {/* Drop file at: /public/videos/mesa-demo.mp4 */}
          </span>
        </div>
      </section>

      {/* ─── Section 6: Testimonials ────────────────────────────────── */}
      {/* NOTE: Replace placeholder testimonials with real user quotes before public launch */}
      <section className={`${CONTAINER}`} style={{ ...MAX_W, paddingTop: "64px", paddingBottom: "64px" }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-10" style={{ color: "#b34519" }}>
          WHAT FAMILIES ARE SAYING
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div
            className="flex flex-col gap-5"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "28px" }}
          >
            <p className="text-sm text-foreground leading-relaxed">
              &ldquo;I used to have recipes saved in 6 different places. Now everything is in Mesa and I can actually find what I&apos;m looking for when I need it.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-semibold" style={{ width: "36px", height: "36px", background: "#f0e0d0", color: "#b34519" }}>
                SM
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sarah M.</p>
                <p className="text-xs text-muted-foreground">Mom of 3, Texas</p>
              </div>
            </div>
          </div>
          {/* Testimonial 2 */}
          <div
            className="flex flex-col gap-5"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "28px" }}
          >
            <p className="text-sm text-foreground leading-relaxed">
              &ldquo;The URL import is magic. I just paste a link and the whole recipe is saved, formatted, and ready to cook. My wife thinks I&apos;m organized now.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-semibold" style={{ width: "36px", height: "36px", background: "#f0e0d0", color: "#b34519" }}>
                JT
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">James T.</p>
                <p className="text-xs text-muted-foreground">Dad of 2, Colorado</p>
              </div>
            </div>
          </div>
          {/* Testimonial 3 */}
          <div
            className="flex flex-col gap-5"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "28px" }}
          >
            <p className="text-sm text-foreground leading-relaxed">
              &ldquo;We use Mesa every single week for meal planning. It has made dinner time so much less stressful for our whole family.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-semibold" style={{ width: "36px", height: "36px", background: "#f0e0d0", color: "#b34519" }}>
                ML
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Maria L.</p>
                <p className="text-xs text-muted-foreground">Busy parent, Florida</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 7: Pricing ─────────────────────────────────────── */}
      <section className={`${CONTAINER}`} style={{ ...MAX_W, paddingTop: "64px", paddingBottom: "64px" }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-3" style={{ color: "#b34519" }}>
          SIMPLE PRICING
        </p>
        <p className="text-sm text-muted-foreground text-center mb-10">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" style={{ maxWidth: "640px", margin: "0 auto" }}>
          {/* Free plan */}
          <div
            className="flex flex-col gap-6"
            style={{ background: "#ffffff", borderRadius: "12px", boxShadow: "0 2px 16px rgba(0,0,0,0.07)", padding: "32px" }}
          >
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Free</p>
              <p className="text-3xl font-bold text-foreground">$0</p>
              <p className="text-xs text-muted-foreground mt-1">Forever free</p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-foreground flex-1">
              {["Up to 25 recipes", "URL and text import", "Recipe collections", "Recipe sharing"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span style={{ color: "#b34519" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg" className="w-full mt-auto">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          {/* Plus plan */}
          <div
            className="flex flex-col gap-6 relative"
            style={{ background: "#fffaf7", borderRadius: "12px", boxShadow: "0 2px 16px rgba(179,69,25,0.12)", padding: "32px", border: "1.5px solid rgba(179,69,25,0.3)" }}
          >
            {/* Most Popular badge */}
            <div
              className="absolute text-xs font-semibold px-3 py-1 rounded-full"
              style={{ top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#b34519", color: "#ffffff", whiteSpace: "nowrap" }}
            >
              Most Popular
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Plus</p>
              <p className="text-3xl font-bold text-foreground">$4.99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <p className="text-xs text-muted-foreground mt-1">or $39.99/year — save 33%</p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-foreground flex-1">
              {[
                "Unlimited recipes",
                "All import types",
                "AI-powered ingredient parsing",
                "Unlimited collections",
                "Priority support",
                "Early access to new features",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span style={{ color: "#b34519" }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col items-center gap-2 mt-auto">
              <Button asChild size="lg" className="w-full">
                <Link href="/register">Start for Free</Link>
              </Button>
              <p className="text-xs text-muted-foreground">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 8: Final CTA ───────────────────────────────────── */}
      <section
        className="flex flex-col items-center text-center px-6"
        style={{ background: "#f0e0d0", paddingTop: "80px", paddingBottom: "80px" }}
      >
        <h2 className="font-bold text-foreground leading-tight" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", maxWidth: "560px" }}>
          Your family&apos;s recipes deserve a real home.
        </h2>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed" style={{ maxWidth: "420px" }}>
          Join families already using Mesa to bring dinner back to the table.
        </p>
        <div className="flex flex-col items-center mt-8" style={{ gap: "12px", width: "100%", maxWidth: "280px" }}>
          <Button asChild size="lg" className="w-full">
            <Link href="/register">Start for Free</Link>
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:underline transition-colors">
            Already have an account? Sign in
          </Link>
        </div>
      </section>

      {/* ─── Section 9: Footer ──────────────────────────────────────── */}
      <footer
        className="px-6 py-8 text-center text-xs text-muted-foreground"
        style={{ borderTop: "1px solid rgba(179,69,25,0.15)", background: "#fffbf4" }}
      >
        Mesa — Made for families. &copy; 2026
      </footer>

    </div>
  );
}
