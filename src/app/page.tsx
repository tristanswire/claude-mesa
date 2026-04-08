import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";

// ─── shared layout constants ────────────────────────────────────────────────
const SECTION = "mx-auto w-full px-6";
const MAX_W = { maxWidth: "1024px" } as const;
const SECTION_Y = { paddingTop: "80px", paddingBottom: "80px" } as const;
const CARD = {
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
} as const;
const EYEBROW = "text-xs font-semibold tracking-widest";
const H2 = "text-[1.75rem] sm:text-[3rem] leading-tight";
const PRIMARY = "#b34519";
const HEADING_COLOR = "hsl(30, 20%, 18%)";

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
          1 — Nav
      ───────────────────────────────────────────────────────────── */}
      <header style={{ background: "#fffbf4" }}>
        <div className={`${SECTION} flex items-center justify-between py-5`} style={MAX_W}>
          <span className="text-xl font-bold" style={{ color: PRIMARY }}>mesa</span>
          <nav className="flex items-center gap-5">
            {[
              { label: "How It Works", href: "#how-it-works" },
              { label: "Why Mesa",     href: "#why-mesa" },
              { label: "For Families", href: "#for-families" },
              { label: "Features",     href: "#features" },
              { label: "Pricing",      href: "#pricing" },
              { label: "FAQ",          href: "#faq" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </a>
            ))}
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2 — Hero
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, paddingTop: "56px", paddingBottom: "64px" }}>
        <div className="flex flex-col-reverse sm:flex-row items-center gap-10 sm:gap-8">

          {/* Left: text */}
          <div className="flex flex-col items-start flex-[3] min-w-0">
            <p className={`${EYEBROW} mb-4`} style={{ color: PRIMARY }}>
              FOR BUSY HOME COOKS
            </p>
            <h1
              className="text-[2rem] sm:text-[3.5rem] leading-tight"
              style={{
                maxWidth: "520px",
                fontFamily: "var(--font-playfair)",
                fontWeight: 800,
                color: HEADING_COLOR,
              }}
            >
              Cooking dinner shouldn&apos;t feel this chaotic.
            </h1>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed" style={{ maxWidth: "440px" }}>
              Mesa turns cluttered recipe websites, screenshots, and saved links into a calm, distraction-free cooking experience — so you can open the recipe and start cooking.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3">
              <Button asChild size="lg" style={{ minWidth: "220px" }}>
                <Link href="/register" style={{ color: "#ffffff" }}>
                  Start Cooking with Less Friction
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">Free to start. No credit card required.</p>
            </div>
          </div>

          {/* Right: hero visual */}
          {/* TODO: Replace with before/after UI screenshot showing messy recipe source on left, clean Mesa version on right */}
          <div
            className="w-full sm:flex-[2] sm:min-w-0 flex-shrink-0 flex items-center justify-center"
            style={{
              background: "#f0e0d0",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              height: "clamp(240px, 38vw, 420px)",
            }}
          >
            <span className="text-xs font-medium text-center px-6" style={{ color: PRIMARY, opacity: 0.6 }}>
              [Hero visual — before/after UI screenshot]
            </span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3 — Trust bar
      ───────────────────────────────────────────────────────────── */}
      <section
        className={SECTION}
        style={{
          ...MAX_W,
          paddingTop: "20px",
          paddingBottom: "20px",
          borderTop: "1px solid rgba(179,69,25,0.12)",
          borderBottom: "1px solid rgba(179,69,25,0.12)",
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            "Ad-free cooking experience",
            "Save recipes from URL, text, screenshots, or manually",
            "Ingredients inline in every step",
            "Built for real family kitchens",
          ].map((item) => (
            <span key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span style={{ color: PRIMARY, fontSize: "10px" }}>●</span>
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4 — Problem section
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        {/* Section header */}
        <p className={`${EYEBROW} text-center mb-3`} style={{ color: PRIMARY }}>
          THE PROBLEM
        </p>
        <h2
          className={`${H2} text-center mb-6`}
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, color: HEADING_COLOR }}
        >
          Dinner gets harder than it needs to be.
        </h2>
        <p
          className="text-base text-muted-foreground leading-relaxed text-center mb-12"
          style={{ maxWidth: "620px", margin: "0 auto 56px" }}
        >
          You find a recipe. Then the friction starts. Too many ads. Long stories you don&apos;t need. Popups. Tiny buttons. Constant scrolling between ingredients and instructions. And when dinner already feels rushed, that extra friction is enough to make cooking at home feel overwhelming. Mesa was built to remove that friction — so when it&apos;s time to cook, you can just cook.
        </p>

        {/* Bento grid */}
        <div className="flex flex-col gap-4">

          {/* Top row: wide left (~60%) + narrow right (~40%) */}
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Card 1 — Cluttered recipe sites (wide) */}
            <div
              className="flex flex-col justify-between gap-6 flex-[3]"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(179,69,25,0.10)",
                borderRadius: "20px",
                padding: "36px",
                minHeight: "320px",
              }}
            >
              <div className="flex flex-col gap-2">
                <h3
                  className="text-2xl sm:text-3xl font-bold leading-tight"
                  style={{ color: "#0f0e0e" }}
                >
                  Cluttered recipe sites
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4a4a4a", maxWidth: "320px" }}>
                  Ads, popups, and long pages built for monetization — not for cooking.
                </p>
              </div>

              {/* TODO: Replace with real UI illustration — mock recipe page with ad blocks */}
              <div
                className="flex flex-col gap-2 mt-2"
                style={{ opacity: 0.35 }}
                aria-hidden="true"
              >
                {/* Fake page chrome */}
                <div className="flex gap-2 mb-1">
                  <div style={{ height: "8px", width: "120px", background: "#d4c5b8", borderRadius: "4px" }} />
                  <div style={{ height: "8px", width: "60px", background: "#e8ddd6", borderRadius: "4px" }} />
                </div>
                {/* Fake ad banner */}
                <div style={{ height: "28px", background: "#f0c8a0", borderRadius: "6px", width: "100%" }} />
                {/* Fake long story text lines */}
                {[100, 90, 95, 80].map((w, i) => (
                  <div key={i} style={{ height: "7px", width: `${w}%`, background: "#e0d4cc", borderRadius: "4px" }} />
                ))}
                {/* Second fake ad */}
                <div style={{ height: "22px", background: "#f0c8a0", borderRadius: "6px", width: "70%", marginTop: "4px" }} />
                {/* More filler lines */}
                {[85, 92].map((w, i) => (
                  <div key={i} style={{ height: "7px", width: `${w}%`, background: "#e0d4cc", borderRadius: "4px" }} />
                ))}
              </div>
            </div>

            {/* Card 2 — Scattered saves (narrow) */}
            <div
              className="flex flex-col justify-between gap-6 flex-[2]"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(179,69,25,0.10)",
                borderRadius: "20px",
                padding: "36px",
                minHeight: "320px",
              }}
            >
              <div className="flex flex-col gap-2">
                <h3
                  className="text-2xl sm:text-3xl font-bold leading-tight"
                  style={{ color: "#0f0e0e" }}
                >
                  Scattered saves
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                  Links in Notes. Screenshots in your camera roll. Recipes saved in five different places.
                </p>
              </div>

              {/* TODO: Replace with real UI illustration — loose grid of screenshots and notes */}
              <div
                className="grid grid-cols-3 gap-2 mt-2"
                style={{ opacity: 0.35 }}
                aria-hidden="true"
              >
                {[
                  { h: "52px", bg: "#e8ddd6" },
                  { h: "40px", bg: "#f0c8a0" },
                  { h: "56px", bg: "#e0d4cc" },
                  { h: "44px", bg: "#f0e0d0" },
                  { h: "36px", bg: "#e8ddd6" },
                  { h: "48px", bg: "#ddd0c8" },
                ].map((box, i) => (
                  <div
                    key={i}
                    style={{ height: box.h, background: box.bg, borderRadius: "8px" }}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* Bottom row: narrow left (~40%) + wide right (~60%) */}
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Card 3 — Too much friction (narrow) */}
            <div
              className="flex flex-col justify-between gap-6 flex-[2]"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(179,69,25,0.10)",
                borderRadius: "20px",
                padding: "36px",
                minHeight: "260px",
              }}
            >
              <div className="flex flex-col gap-2">
                <h3
                  className="text-2xl sm:text-3xl font-bold leading-tight"
                  style={{ color: "#0f0e0e" }}
                >
                  Too much friction
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
                  When everyone&apos;s hungry, you don&apos;t want to decode a website. You want to make dinner.
                </p>
              </div>

              {/* TODO: Replace with real UI illustration — cluttered UI or loading state */}
              <div
                className="flex items-center justify-center gap-3 mt-2"
                style={{ opacity: 0.3 }}
                aria-hidden="true"
              >
                {/* Fake overlapping UI elements suggesting clutter */}
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e0d4cc" }} />
                <div className="flex flex-col gap-1.5">
                  <div style={{ height: "8px", width: "80px", background: "#e8ddd6", borderRadius: "4px" }} />
                  <div style={{ height: "8px", width: "60px", background: "#f0e0d0", borderRadius: "4px" }} />
                  <div style={{ height: "8px", width: "72px", background: "#e0d4cc", borderRadius: "4px" }} />
                </div>
                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#f0c8a0" }} />
              </div>
            </div>

            {/* Card 4 — Mesa's answer (wide, implicit CTA) */}
            <div
              className="flex flex-col justify-between gap-6 flex-[3]"
              style={{
                background: "#fffaf7",
                border: "1px solid rgba(179,69,25,0.15)",
                borderRadius: "20px",
                padding: "36px",
                minHeight: "260px",
              }}
            >
              <div className="flex flex-col gap-2">
                <h3
                  className="text-2xl sm:text-3xl font-bold leading-tight"
                  style={{ color: "#0f0e0e" }}
                >
                  Mesa removes all of it.
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4a4a4a", maxWidth: "340px" }}>
                  One calm place for every recipe. No ads. No clutter. Ingredients right where you need them. Just open it and cook.
                </p>
              </div>
              <div>
                <a
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: PRIMARY }}
                >
                  Start cooking with less friction
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5 — How it works
      ───────────────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className={SECTION}
        style={{ ...MAX_W, paddingTop: "80px", paddingBottom: "80px" }}
      >
        <p className={`${EYEBROW} text-center mb-3`} style={{ color: PRIMARY }}>
          HOW IT WORKS
        </p>
        <h2
          className={`${H2} text-center mb-14`}
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, color: HEADING_COLOR }}
        >
          From saved recipe to dinner, without the chaos.
        </h2>

        {/* Two-column layout: phone mockup left, steps right */}
        <div className="flex flex-col sm:flex-row items-center gap-12 sm:gap-16">

          {/* Left: phone/device mockup */}
          {/* TODO: Replace with app screenshot in device frame */}
          <div
            className="flex-shrink-0 flex items-center justify-center self-stretch w-full sm:w-auto"
            style={{
              background: "#f0e0d0",
              borderRadius: "28px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              minHeight: "420px",
              width: "clamp(200px, 36%, 280px)",
            }}
          >
            <span className="text-xs font-medium text-center px-6" style={{ color: PRIMARY, opacity: 0.5 }}>
              [App screenshot in device frame]
            </span>
          </div>

          {/* Right: numbered steps */}
          <div className="flex flex-col flex-1 min-w-0">
            {[
              {
                num: "01",
                headline: "Save it",
                body: "Import a recipe from a URL, pasted text, screenshot, or manual entry.",
              },
              {
                num: "02",
                headline: "Clean it up",
                body: "Mesa strips away the clutter and turns it into a focused recipe with the image, ingredients, and instructions you actually need.",
              },
              {
                num: "03",
                headline: "Start cooking",
                body: "Open the recipe and cook with ingredients placed inline in the steps, in metric or imperial — no bouncing back and forth.",
              },
            ].map((step, i, arr) => (
              <div key={step.num}>
                <div className="flex items-center gap-4 py-7">
                  {/* Step content */}
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <h3 className="font-bold text-2xl sm:text-3xl text-foreground">{step.headline}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                  {/* Decorative step number — faded, right-aligned */}
                  <span
                    className="flex-shrink-0 font-bold tabular-nums select-none"
                    style={{
                      fontSize: "3.5rem",
                      lineHeight: 1,
                      color: "#0f0e0e",
                      opacity: 0.07,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {step.num}
                  </span>
                </div>
                {/* Divider between steps, not after last */}
                {i < arr.length - 1 && (
                  <div style={{ height: "1px", background: "rgba(179,69,25,0.12)" }} />
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6 — Core differentiator (inline ingredients)
      ───────────────────────────────────────────────────────────── */}
      <section id="why-mesa" className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <div className="flex flex-col sm:flex-row items-center gap-12 sm:gap-16">

          {/* Left: text */}
          <div className="flex flex-col flex-1 min-w-0">
            <p className={`${EYEBROW} mb-4`} style={{ color: PRIMARY }}>
              WHY MESA FEELS DIFFERENT
            </p>
            <h2
              className={`${H2} mb-5`}
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, color: HEADING_COLOR }}
            >
              Every ingredient, exactly where you need it.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6" style={{ maxWidth: "460px" }}>
              Most recipe sites make you scroll up for ingredients, then back down for instructions, over and over again. Mesa places ingredient amounts directly inside the steps — in your preferred units — so cooking feels smoother, faster, and far less distracting.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Ingredients inline in the instructions",
                "Metric or imperial, your choice",
                "Clean, readable recipe layout",
                "Designed to help you cook, not keep you on a page",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: PRIMARY }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: inline ingredient visual */}
          {/* TODO: Replace with screenshot showing inline ingredient experience in Mesa */}
          <div
            className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center"
            style={{
              background: "#f0e0d0",
              borderRadius: "16px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              width: "clamp(260px, 38%, 400px)",
              height: "clamp(240px, 32vw, 380px)",
            }}
          >
            <span className="text-xs font-medium text-center px-6" style={{ color: PRIMARY, opacity: 0.6 }}>
              [Inline ingredient screenshot]
            </span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7 — Built for real life (families)
      ───────────────────────────────────────────────────────────── */}
      <span id="features" aria-hidden="true" />
      <section
        id="for-families"
        className={`${SECTION} flex flex-col items-center text-center`}
        style={{ ...MAX_W, ...SECTION_Y }}
      >
        <p className={`${EYEBROW} mb-3`} style={{ color: PRIMARY }}>
          BUILT FOR REAL LIFE
        </p>
        <h2
          className={`${H2} mb-5`}
          style={{ maxWidth: "620px", fontFamily: "var(--font-playfair)", fontWeight: 700, color: HEADING_COLOR }}
        >
          For busy nights, hungry kids, and less mental load.
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed mb-8" style={{ maxWidth: "560px" }}>
          Mesa is built for anyone who wants less friction in the kitchen — especially families. When dinner already feels chaotic, you should be able to open a recipe and start cooking without ads, clutter, or constant back-and-forth.
        </p>
        <ul className="flex flex-col items-center gap-3">
          {[
            "No ads or clutter",
            "Ingredients inline, no scrolling back and forth",
            "One place for all your recipes",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-base text-foreground">
              <span style={{ color: PRIMARY }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9 — Pricing (formerly 10)
      ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <p className={`${EYEBROW} text-center mb-3`} style={{ color: PRIMARY }}>
          SIMPLE PRICING
        </p>
        <h2
          className={`${H2} text-center mb-2`}
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, color: HEADING_COLOR }}
        >
          Start free. Upgrade when you need more room.
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12">
          No tricks. No trial periods. Free means free.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mx-auto" style={{ maxWidth: "720px" }}>

          {/* Free */}
          <div className="flex flex-col gap-5" style={{ ...CARD, padding: "32px" }}>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Free</p>
              <p className="text-4xl font-bold" style={{ color: HEADING_COLOR }}>$0</p>
              <p className="text-xs text-muted-foreground mt-1">Forever free</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                For trying Mesa and simplifying your core recipes.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-foreground flex-1">
              {[
                "Up to 25 recipes",
                "Basic URL and text import",
                "Save and organize recipes",
                "Recipe sharing",
                "Light and dark mode",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span style={{ color: PRIMARY }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg" className="w-full mt-auto">
              <Link href="/register">Start Cooking with Less Friction</Link>
            </Button>
          </div>

          {/* Plus */}
          <div className="flex flex-col gap-5 relative" style={{ ...CARD, padding: "32px", background: "#fffaf7", border: `2px solid ${PRIMARY}` }}>
            <div
              className="absolute text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                top: "-14px",
                left: "50%",
                transform: "translateX(-50%)",
                background: PRIMARY,
                color: "#ffffff",
                whiteSpace: "nowrap",
              }}
            >
              Most Popular
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Plus</p>
              <p className="text-4xl font-bold" style={{ color: HEADING_COLOR }}>
                $4.99<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">or $39.99/year — save 33%</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                For busy cooks who want their full recipe home in one place.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm text-foreground flex-1">
              {[
                "Unlimited recipes",
                "All import types",
                "Unlimited collections",
                "Recipe sharing",
                "Priority support",
                "Early access to new features",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span style={{ color: PRIMARY }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 mt-auto">
              <Button asChild size="lg" className="w-full">
                <Link href="/register" style={{ color: "#ffffff" }}>Go Plus</Link>
              </Button>
              <p className="text-xs text-muted-foreground text-center">No credit card. Cancel anytime.</p>
            </div>
          </div>

        </div>

        {/* Coming soon teaser */}
        <p className="text-xs text-muted-foreground text-center mt-6" style={{ opacity: 0.7 }}>
          Coming soon for Plus — Quick dinner ideas when you don&apos;t know what to make.
        </p>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          11 — FAQ
      ───────────────────────────────────────────────────────────── */}
      <section id="faq" className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <p className={`${EYEBROW} text-center mb-3`} style={{ color: PRIMARY }}>
          FAQ
        </p>
        <h2
          className={`${H2} text-center mb-10`}
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, color: HEADING_COLOR }}
        >
          Questions? Here are the common ones.
        </h2>

        <div className="flex flex-col mx-auto" style={{ maxWidth: "680px", gap: "2px" }}>
          {[
            {
              q: "Is Mesa a recipe discovery app?",
              a: "No. Mesa is built to make cooking easier, not to overwhelm you with more content. It helps you save, clean up, and cook the recipes you already want to make.",
            },
            {
              q: "What kinds of recipes can I import?",
              a: "You can import recipes from URLs, pasted text, screenshots, or manual entry.",
            },
            {
              q: "Does Mesa remove ads and long blog content?",
              a: "Yes. Mesa turns messy recipe pages into a focused format with the image, ingredients, and instructions you actually need.",
            },
            {
              q: "What makes Mesa different from other cooking apps?",
              a: "Mesa is built around cooking with less friction. Recipes are cleaned up, ingredients are placed inline in the instructions, and the experience is designed to help you cook faster with less distraction.",
            },
            {
              q: "Can I switch between metric and imperial?",
              a: "Yes. Mesa supports both, so you can cook the way that makes the most sense for you.",
            },
            {
              q: "Who is Mesa for?",
              a: "Anyone who wants a calmer cooking experience — especially busy people and families trying to make dinner at home with less chaos.",
            },
            {
              q: "What happens if I stay on the free plan?",
              a: "You can keep using Mesa with up to 25 recipes and core features. Upgrade when you want more space and more import flexibility.",
            },
          ].map((item, i) => (
            <details
              key={i}
              className="group"
              style={{ borderBottom: "1px solid rgba(179,69,25,0.12)" }}
            >
              <summary
                className="flex items-center justify-between gap-4 py-4 cursor-pointer text-sm font-medium text-foreground select-none list-none"
                style={{ outline: "none" }}
              >
                <span>{item.q}</span>
                {/* chevron — rotates open via CSS group-open */}
                <svg
                  className="flex-shrink-0 transition-transform duration-200 group-open:rotate-180"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: PRIMARY, opacity: 0.7 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed pb-4 pt-1" style={{ maxWidth: "560px" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          12 — Founder story
      ───────────────────────────────────────────────────────────── */}
      <section className={SECTION} style={{ ...MAX_W, ...SECTION_Y }}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-12">

          {/* Left: text */}
          <div className="flex flex-col flex-1 min-w-0">
            <p className={`${EYEBROW} mb-4`} style={{ color: PRIMARY }}>
              WHY I BUILT MESA
            </p>
            <h2
              className={`${H2} mb-6`}
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 700, color: HEADING_COLOR }}
            >
              Built because cooking online got worse, not better.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4" style={{ maxWidth: "500px" }}>
              I didn&apos;t build Mesa to make another recipe app. I built it because cooking from the internet has become unnecessarily frustrating. Too many ads. Too much clutter. Too much friction when all you&apos;re trying to do is get dinner on the table.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ maxWidth: "500px" }}>
              Mesa is my answer to that: a calmer, cleaner way to save recipes and start cooking — especially for busy families trying to eat at home more often.
            </p>
            <div className="mt-6 flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">Tristan Swire</p>
              <p className="text-xs text-muted-foreground">For families who want dinner to feel simpler</p>
            </div>
          </div>

          {/* Right: founder photo */}
          {/* TODO: Replace with founder photo — <Image src="/images/founder-photo.jpg" alt="Tristan Swire" width={200} height={200} style={{ borderRadius: "50%" }} /> */}
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "#f0e0d0",
            }}
          >
            <span className="font-bold" style={{ fontSize: "48px", color: PRIMARY, opacity: 0.5 }}>
              TS
            </span>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          13 — Final CTA
      ───────────────────────────────────────────────────────────── */}
      <section
        className="flex flex-col items-center text-center px-6"
        style={{ background: "#f0e0d0", paddingTop: "80px", paddingBottom: "80px" }}
      >
        <h2
          className={H2}
          style={{ maxWidth: "600px", fontFamily: "var(--font-playfair)", fontWeight: 800, color: HEADING_COLOR }}
        >
          Less friction. Better dinners. One calm place for your recipes.
        </h2>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed" style={{ maxWidth: "460px" }}>
          Stop cooking from cluttered websites and scattered saves. Bring your recipes into one focused space and start cooking with less stress.
        </p>
        <div className="flex flex-col items-center mt-8" style={{ gap: "12px", width: "100%", maxWidth: "300px" }}>
          <Button asChild size="lg" className="w-full">
            <Link href="/register" style={{ color: "#ffffff" }}>Start Cooking with Less Friction</Link>
          </Button>
          <p className="text-xs text-muted-foreground">Free to start. No credit card required.</p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          13 — Footer
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
