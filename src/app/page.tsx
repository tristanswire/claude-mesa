import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FileText, Clock, BookOpen, Scale, Users } from "lucide-react";

const SECTION = "mx-auto w-full px-6";
const MAX_W = { maxWidth: "1024px" } as const;
const SECTION_Y = { paddingTop: "80px", paddingBottom: "80px" } as const;

const CARD = {
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
} as const;

const ICON_WRAP = {
  width: "44px",
  height: "44px",
  borderRadius: "10px",
  background: "rgba(179,69,25,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
} as const;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/recipes");
  }

  return (
    <div className="flex flex-col" style={{ background: "#fffbf4" }}>

      {/* ─────────────────────────────────────────────────────────────
          Section 1 — Nav
      ───────────────────────────────────────────────────────────── */}
      <header style={{ background: "#fffbf4" }}>
        <div className={`${SECTION} flex items-center justify-between py-5`} style={MAX_W}>
          <span className="text-xl font-bold" style={{ color: "#b34519" }}>Mesa</span>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          Section 2 — Hero (left text / right screenshot)
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, paddingTop: "48px", paddingBottom: "64px" }}>
        <div className="flex flex-col-reverse sm:flex-row items-center gap-10 sm:gap-12">

          {/* Left: text */}
          <div className="flex flex-col items-start flex-1 min-w-0">
            <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: "#b34519" }}>
              RECIPE COMPANION
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-7xl text-foreground leading-tight" style={{ maxWidth: "480px", fontFamily: "var(--font-playfair)", fontWeight: 800 }}>
              Dinner shouldn&apos;t be this hard.
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed" style={{ maxWidth: "420px" }}>
              Mesa helps busy families save recipes, plan meals, and bring everyone to the table — without the chaos.
            </p>
            <div className="mt-8 flex flex-col items-start" style={{ gap: "10px" }}>
              <Button asChild size="lg" style={{ minWidth: "200px" }}>
                <Link href="/register">Start for Free</Link>
              </Button>
              <p className="text-xs text-muted-foreground">Free to start. No credit card required.</p>
              <Link href="/login" className="text-sm text-muted-foreground hover:underline transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </div>

          {/* Right: hero screenshot placeholder */}
          {/* PLACEHOLDER: replace content with <Image src="/public/images/mesa-hero-screenshot.png" ... /> */}
          <div
            className="flex items-center justify-center w-full sm:flex-1 sm:min-w-0 flex-shrink-0"
            style={{
              background: "#f0e0d0",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              height: "clamp(240px, 38vw, 420px)",
              minWidth: 0,
            }}
          >
            <span className="text-xs font-medium text-center px-6" style={{ color: "#b34519", opacity: 0.6 }}>
              [Hero screenshot — replace with /public/images/mesa-hero-screenshot.png]
            </span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Section 3 — How It Works
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, paddingTop: "64px", paddingBottom: "80px" }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-3" style={{ color: "#b34519" }}>
          HOW IT WORKS
        </p>
        <h2 className="text-3xl sm:text-4xl text-foreground text-center mb-12" style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}>
          From scattered to sorted in minutes.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              num: "01",
              headline: "Save your recipes",
              desc: "Import from any URL, paste from anywhere, or create from scratch. Mesa strips the ads and clutter and keeps just what you need.",
            },
            {
              num: "02",
              headline: "Plan your meals",
              desc: "Organize recipes into collections for the week. Know what you're cooking before 5pm hits and the chaos starts.",
            },
            {
              num: "03",
              headline: "Cook with ease",
              desc: "Cooking mode keeps everything on one screen. No more scrolling with oily fingers. Just cook.",
            },
          ].map((step) => (
            <div key={step.num} className="flex flex-col gap-3">
              <span className="font-bold" style={{ fontSize: "2.5rem", color: "#b34519", opacity: 0.18, lineHeight: 1 }}>
                {step.num}
              </span>
              <h3 className="font-semibold text-lg text-foreground">{step.headline}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Section 4 — Problem
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-3" style={{ color: "#b34519" }}>
          SOUND FAMILIAR?
        </p>
        <h2 className="text-3xl sm:text-4xl text-foreground text-center mb-10" style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}>
          Sound Familiar?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col items-center text-center gap-4" style={{ ...CARD, padding: "32px" }}>
            <div style={ICON_WRAP}>
              <FileText size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Your recipes are everywhere.</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Saved in browser tabs. Screenshotted on your phone. Written on paper you can&apos;t find. You have great recipes — you just can&apos;t find them when you need them.
            </p>
          </div>
          <div className="flex flex-col items-center text-center gap-4" style={{ ...CARD, padding: "32px" }}>
            <div style={ICON_WRAP}>
              <Clock size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-lg text-foreground">What&apos;s for dinner?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every. Single. Night. The mental load of figuring out meals for a busy family is exhausting. There has to be a better way.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Section 5 — Features
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-3" style={{ color: "#b34519" }}>
          EVERYTHING IN ONE PLACE
        </p>
        <h2 className="text-3xl sm:text-4xl text-foreground text-center mb-10" style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}>
          Everything in one place.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col items-center gap-3 text-center" style={{ ...CARD, padding: "28px" }}>
            <div style={ICON_WRAP}>
              <BookOpen size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-foreground">Save any recipe</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Import from any URL, paste from anywhere, or create from scratch. Your recipes, beautifully organized and always findable.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center" style={{ ...CARD, padding: "28px" }}>
            <div style={ICON_WRAP}>
              <Scale size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-foreground">Cook with confidence</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ingredients scale automatically. No more mental math mid-cook. Just tap and cook.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center" style={{ ...CARD, padding: "28px" }}>
            <div style={ICON_WRAP}>
              <Users size={20} style={{ color: "#b34519" }} />
            </div>
            <h3 className="font-semibold text-foreground">Gather together</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plan meals for the week. Feed your family without the stress. Dinner time becomes something everyone looks forward to.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Section 6 — Demo Video Placeholder
      ───────────────────────────────────────────────────────────── */}
      <section className={`${SECTION} flex flex-col items-center`} style={{ ...MAX_W, ...SECTION_Y }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-10 text-muted-foreground">
          SEE IT IN ACTION
        </p>
        {/* PLACEHOLDER: replace with <video src="/public/videos/mesa-demo.mp4" autoPlay muted loop playsInline />
            or embed a Loom/YouTube iframe */}
        <div
          className="w-full flex items-center justify-center"
          style={{
            background: "#f0e0d0",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            maxWidth: "860px",
            height: "clamp(280px, 42vw, 480px)",
          }}
        >
          <span className="text-xs font-medium text-center px-8" style={{ color: "#b34519", opacity: 0.6 }}>
            [Demo video — replace with /public/videos/mesa-demo.mp4 or embed link]
          </span>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Section 7 — Founder
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-12">

          {/* Left: text */}
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: "#b34519" }}>
              WHY MESA EXISTS
            </p>
            <h2 className="text-3xl sm:text-4xl text-foreground mb-6" style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}>
              Built out of frustration.
            </h2>
            <div className="flex flex-col gap-4 text-sm text-muted-foreground leading-relaxed" style={{ maxWidth: "500px" }}>
              <p>
                I built Mesa to solve my own problem with current cooking sites and apps. Sites are littered with ads that ruin the cooking experience every time. Ingredients and instructions are split, causing friction when all I want to do is cook. And there&apos;s no cooking mode — so I&apos;m stuck scrolling all over the place with oily fingers.
              </p>
              <p>
                I wanted something minimal and easy to use for busy lives like mine. So I built it.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">Tristan Swire</p>
              <a
                href="https://tristanswire.com"
                className="text-sm text-muted-foreground hover:underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Follow along →
              </a>
            </div>
          </div>

          {/* Right: founder photo placeholder */}
          {/* PLACEHOLDER: replace with <Image src="/public/images/founder-photo.jpg" ... /> */}
          <div className="flex-shrink-0 flex items-center justify-center" style={{ width: "200px", height: "200px", borderRadius: "50%", background: "#f0e0d0" }}>
            <span className="font-bold" style={{ fontSize: "48px", color: "#b34519", opacity: 0.5 }}>TS</span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Section 8 — Testimonials
          NOTE: Replace placeholder quotes with real user testimonials before public launch
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-3" style={{ color: "#b34519" }}>
          WHAT FAMILIES ARE SAYING
        </p>
        <h2 className="text-3xl sm:text-4xl text-foreground text-center mb-10" style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}>
          What families are saying.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              quote: "I used to have recipes saved in 6 different places. Now everything is in Mesa and I can actually find what I'm looking for when I need it.",
              name: "Sarah M.",
              desc: "Mom of 3, Texas",
              initials: "SM",
            },
            {
              quote: "The URL import is magic. I just paste a link and the whole recipe is saved, formatted, and ready to cook. My wife thinks I'm organized now.",
              name: "James T.",
              desc: "Dad of 2, Colorado",
              initials: "JT",
            },
            {
              quote: "We use Mesa every single week for meal planning. It has made dinner time so much less stressful for our whole family.",
              name: "Maria L.",
              desc: "Busy parent, Florida",
              initials: "ML",
            },
          ].map((t) => (
            <div key={t.initials} className="flex flex-col gap-5" style={{ ...CARD, padding: "28px" }}>
              <p className="text-sm text-foreground leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center flex-shrink-0 text-xs font-semibold rounded-full"
                  style={{ width: "36px", height: "36px", background: "#f0e0d0", color: "#b34519" }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          Section 9 — Pricing
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <p className="text-xs font-semibold tracking-widest text-center mb-3" style={{ color: "#b34519" }}>
          SIMPLE PRICING
        </p>
        <h2 className="text-3xl sm:text-4xl text-foreground text-center mb-3" style={{ fontFamily: "var(--font-playfair)", fontWeight: 700 }}>
          Simple pricing.
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12">
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mx-auto" style={{ maxWidth: "700px" }}>

          {/* Free */}
          <div className="flex flex-col gap-6" style={{ ...CARD, padding: "32px" }}>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Free</p>
              <p className="text-4xl font-bold text-foreground">$0</p>
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

          {/* Plus */}
          <div
            className="flex flex-col gap-6 relative"
            style={{
              ...CARD,
              padding: "32px",
              background: "#fffaf7",
              border: "2px solid #b34519",
            }}
          >
            <div
              className="absolute text-xs font-semibold px-3 py-1 rounded-full"
              style={{ top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#b34519", color: "#ffffff", whiteSpace: "nowrap" }}
            >
              Most Popular
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Plus</p>
              <p className="text-4xl font-bold text-foreground">
                $4.99<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
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

      {/* ─────────────────────────────────────────────────────────────
          Section 10 — Final CTA
      ───────────────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center text-center px-6"
        style={{ background: "#f0e0d0", paddingTop: "80px", paddingBottom: "80px" }}
      >
        <h2 className="text-3xl sm:text-4xl text-foreground leading-tight" style={{ maxWidth: "560px", fontFamily: "var(--font-playfair)", fontWeight: 800 }}>
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

      {/* ─────────────────────────────────────────────────────────────
          Section 11 — Footer
      ───────────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-8 text-center"
        style={{ borderTop: "1px solid rgba(179,69,25,0.15)", background: "#fffbf4" }}
      >
        <p className="text-xs text-muted-foreground">
          Mesa — Made for families. &copy; 2026
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:underline transition-colors">
            Privacy Policy
          </Link>
          <span className="text-xs text-muted-foreground">·</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:underline transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>

    </div>
  );
}
