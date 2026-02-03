# Mesa - Recipe App

A recipe management app with inline ingredient measurements, built with Next.js 14 and Supabase.

## Features

- User authentication (email/password)
- Recipe management with inline ingredient references
- Imperial/Metric unit conversion
- Stacks (collections) for organizing recipes
- Import recipes from URLs (JSON-LD parsing)
- Import recipes from pasted text
- Automatic instruction simplification (removes blog junk)

## Tech Stack

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Database/Auth**: Supabase (PostgreSQL + Supabase Auth)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Validation**: Zod schemas
- **Testing**: Vitest

## Prerequisites

- Node.js 18+
- npm
- Supabase account (for database and auth)

---

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd claude-mesa
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required: Supabase connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Required: App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Supabase service role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Stripe billing (only if enabling paid plans)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS=price_...
```

Get Supabase values from your project:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** > **API**
4. Copy the **Project URL** and **anon/public** key
5. Copy the **service_role** key (keep this secret!)

### 3. Set Up Database Schema

Run the SQL migration to create tables, triggers, and RLS policies:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** > **New Query**
3. Copy the contents of `supabase/migrations/0001_init.sql`
4. Paste into the SQL Editor and click **Run**

This creates:
- `user_preferences` - User settings (unit system preference)
- `recipes` - Recipe data with JSONB ingredients/instructions
- `stacks` - Recipe collections
- `recipe_stacks` - Many-to-many recipe-stack associations
- Row Level Security policies for all tables
- Triggers for auto-updating timestamps

### 4. Configure Supabase Auth

In your Supabase dashboard:
1. Go to **Authentication** > **Providers**
2. Ensure **Email** provider is enabled
3. (Optional) Disable email confirmation for faster testing

For local development, also configure:
1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to `http://localhost:3000`
3. Add `http://localhost:3000/**` to **Redirect URLs**

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel Recommended)

### 1. Push to GitHub

Ensure your code is pushed to a GitHub repository.

### 2. Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and import your repository
2. Configure environment variables (see [Environment Variables Reference](#environment-variables-reference)):
   - `NEXT_PUBLIC_SUPABASE_URL` (required)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
   - `NEXT_PUBLIC_APP_URL` = your production URL (e.g., `https://your-app.vercel.app`)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for billing webhooks)
   - `STRIPE_SECRET_KEY` (if billing enabled)
   - `STRIPE_WEBHOOK_SECRET` (if billing enabled)
   - `STRIPE_PRICE_ID_PLUS` (if billing enabled)
3. Deploy

### 3. Configure Supabase Auth (Critical!)

**This step is required for authentication to work in production.**

Go to Supabase Dashboard > **Authentication** > **URL Configuration**:

#### Site URL
Set to your **production domain**:
```
https://your-app.vercel.app
```

#### Redirect URLs
Add **all** URLs where users might authenticate from:

```
# Production
https://your-app.vercel.app/**

# Vercel Preview Deployments (if using)
https://*.vercel.app/**

# Local development
http://localhost:3000/**
```

> **Why the wildcard?** Vercel creates unique URLs for each preview deployment (e.g., `https://your-app-abc123.vercel.app`). The `*.vercel.app/**` pattern allows all preview deployments to work.

Click **Save** after adding all URLs.

### 4. Supabase Auth Configuration Checklist

Use this checklist to verify your auth setup:

- [ ] **Site URL** is set to production domain (not localhost)
- [ ] **Redirect URLs** includes production domain with `/**` wildcard
- [ ] **Redirect URLs** includes preview pattern `https://*.vercel.app/**` (if using previews)
- [ ] **Redirect URLs** includes `http://localhost:3000/**` (for local dev)
- [ ] Email provider is enabled in **Authentication** > **Providers**
- [ ] (Optional) Email confirmation disabled for faster testing

### 5. Set Up Stripe Webhook (If Billing Enabled)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Copy the **Signing secret** and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### 6. Verify Deployment

Check the health endpoint:
```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "supabase": {
    "connected": true,
    "latencyMs": 50
  }
}
```

### 7. Test Authentication Flow

1. Visit your production URL
2. Click **Sign Up** and create an account
3. Check email for confirmation (if enabled)
4. Verify you can log in and access `/recipes`

If auth fails, check:
- Supabase Site URL matches your domain
- Redirect URLs include your domain
- Browser console for errors

---

## Environment Variables Reference

### Public Variables (Client + Server)

These are embedded in the client bundle and visible to users.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `NEXT_PUBLIC_APP_URL` | Yes | Your app URL (e.g., `http://localhost:3000` or `https://your-app.vercel.app`) |

### Server-Only Variables

These are never exposed to the client. Keep them secret!

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | For billing | Supabase service role key (bypasses RLS) |
| `STRIPE_SECRET_KEY` | For billing | Stripe secret key (starts with `sk_`) |
| `STRIPE_WEBHOOK_SECRET` | For billing | Stripe webhook signing secret (starts with `whsec_`) |
| `STRIPE_PRICE_ID_PLUS` | For billing | Stripe Price ID for Plus plan (starts with `price_`) |

### Environment Variable Validation

The app validates environment variables at startup using Zod schemas in `src/lib/env.ts`.

If required variables are missing, you'll see a clear error:
```
Missing or invalid public environment variables:
  NEXT_PUBLIC_SUPABASE_URL: Required
  NEXT_PUBLIC_SUPABASE_ANON_KEY: Required

See README.md for required environment variables.
```

### Example `.env.local` (Development)

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase service role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (only if testing billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PLUS=price_...
```

---

## Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once

# Linting/Formatting
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, register)
│   ├── (dashboard)/      # Protected pages (recipes, stacks, settings)
│   │   ├── recipes/      # Recipe list, detail, edit, import
│   │   ├── stacks/       # Stack list, detail, edit
│   │   └── settings/     # User preferences
│   ├── api/
│   │   ├── auth/         # Auth callback route
│   │   └── health/       # Health check endpoint
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── layout/           # Layout components (Header)
│   ├── providers/        # Context providers (Toast)
│   ├── recipe/           # Recipe components
│   ├── stack/            # Stack components
│   └── ui/               # Reusable UI (Loading, Empty, Error states)
└── lib/
    ├── actions/          # Server actions (recipes, stacks, import)
    ├── analytics/        # Event tracking (non-blocking)
    ├── db/               # Database access functions
    ├── import/           # Import pipeline (fetcher, jsonld, simplifier)
    ├── schemas/          # Zod validation schemas
    ├── supabase/         # Supabase client configuration
    ├── env.ts            # Environment variable validation (Zod)
    ├── logger.ts         # Server-side logging
    ├── rate-limit.ts     # Rate limiting utility
    ├── render.ts         # Instruction rendering
    └── units.ts          # Unit conversion

supabase/
└── migrations/
    ├── 0001_init.sql           # Base database schema
    ├── 0002_entitlements.sql   # User entitlements
    ├── 0003_recipe_shares.sql  # Recipe sharing
    ├── 0004_theme_preference.sql # Theme preferences
    └── 0005_recipe_images.sql  # Recipe image support
```

---

## API Endpoints

### Health Check
```
GET /api/health
```

Returns application health status and Supabase connection status.

**Response:**
```json
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "supabase": {
    "connected": true,
    "latencyMs": 50
  }
}
```

---

## Data Model

### Ingredient (JSONB in recipes.ingredients)

```typescript
{
  id: string;           // UUID
  name: string;         // "cumin"
  notes?: string;       // "ground"
  originalQuantity: number | null;  // 1
  originalUnit: string | null;      // "tsp"
  originalText: string;             // "1 tsp cumin, ground"
  canonicalQuantity: number | null; // 4.93 (ml)
  canonicalUnit: "ml" | "g" | null;
  ingredientType: "volume" | "weight" | "count";
  orderIndex: number;
}
```

### InstructionStep (JSONB in recipes.instructions)

```typescript
{
  id: string;           // UUID
  stepNumber: number;   // 1, 2, 3...
  text: string;         // "Mix the dry ingredients"
  refs: [{
    ingredientIds: string[];  // UUIDs of ingredients to show inline
    placement: "end";         // Append at end of step
  }]
}
```

---

## Rate Limiting

Import operations are rate limited to prevent abuse:
- **Limit**: 10 imports per minute per user
- **Type**: In-memory (resets on server restart)

For production at scale, consider using Redis or Upstash rate limiting.

---

## Troubleshooting

### Environment variable errors at startup
If you see "Missing or invalid environment variables":
1. Check that `.env.local` exists in the project root
2. Verify all required variables are set (see [Environment Variables Reference](#environment-variables-reference))
3. Restart the dev server after changing `.env.local`
4. For Vercel, verify env vars in Project Settings > Environment Variables

### "Invalid URL" error during import
- Ensure the URL starts with `http://` or `https://`
- Some sites block automated requests; try pasting the recipe text instead

### "No JSON-LD data found"
- The recipe site doesn't use structured data
- Use the "Paste Text" import option instead

### "Request timed out"
- The recipe site is slow or blocking requests
- Try again later or use paste-text import

### Auth redirect not working
- Verify Site URL and Redirect URLs in Supabase match your deployment URL
- Check that the callback route exists at `/api/auth/callback`

### "Could not find the 'image_path' column" error
This error means the recipe images migration hasn't been applied yet.

**Step 1: Run the migration**
```sql
-- Run in Supabase Dashboard > SQL Editor
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS image_path TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;
```

**Step 2: Refresh PostgREST schema cache**
```sql
-- Run immediately after the migration
NOTIFY pgrst, 'reload schema';
```

**Step 3: If still failing, restart PostgREST**
- Go to Supabase Dashboard > Project Settings > General
- Click "Restart project" (or wait a few minutes for cache to refresh)

**Full migration file:** `supabase/migrations/0005_recipe_images.sql`

---

## Recipe Images Setup (Optional)

To enable recipe image uploads:

### 1. Run the database migration
```sql
-- In Supabase SQL Editor
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS image_path TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

### 2. Create Storage bucket
In Supabase Dashboard > Storage:
1. Click "New bucket"
2. Name: `recipe-images`
3. Public bucket: **Yes**
4. File size limit: 5MB
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

### 3. Add Storage RLS policies
```sql
-- Run in SQL Editor after creating bucket

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own recipe images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/replace their own images
CREATE POLICY "Users can update own recipe images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own recipe images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recipe-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to read images (public bucket)
CREATE POLICY "Anyone can view recipe images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipe-images');
```

---

## Documentation

- [Launch Checklist](docs/launch-checklist.md) - Pre-launch verification (RLS, env vars, auth)
- [Smoke Test](docs/smoke-test.md) - Manual testing guide

---

## License

MIT
