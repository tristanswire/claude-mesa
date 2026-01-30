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
```

Get these values from your Supabase project:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** > **API**
4. Copy the **Project URL** and **anon/public** key

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
2. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### 3. Post-Deploy: Update Supabase Settings

After deployment, update Supabase to allow your production URL:

1. Go to Supabase Dashboard > **Authentication** > **URL Configuration**
2. Update **Site URL** to your Vercel URL (e.g., `https://your-app.vercel.app`)
3. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/api/auth/callback`
4. Click **Save**

### 4. Verify Deployment

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

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public key |

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
    ├── db/               # Database access functions
    ├── import/           # Import pipeline (fetcher, jsonld, simplifier)
    ├── schemas/          # Zod validation schemas
    ├── supabase/         # Supabase client configuration
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

## License

MIT
