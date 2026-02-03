# Mesa Smoke Test Checklist

Run this checklist after each deployment (production and preview) to verify core functionality.

## Prerequisites

- [ ] App loads without console errors
- [ ] All environment variables are configured
- [ ] Database is accessible

---

## 1. Authentication

### Sign Up (new account)
- [ ] Navigate to `/register`
- [ ] Enter email and password
- [ ] Submit form
- [ ] **Expected:** Redirected to `/recipes` or email confirmation sent

### Login
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Submit form
- [ ] **Expected:** Redirected to `/recipes`, user menu shows email

### Logout
- [ ] Click user avatar in header
- [ ] Click "Sign Out"
- [ ] **Expected:** Redirected to `/login`, no longer authenticated

---

## 2. Recipes

### Create Recipe
- [ ] Navigate to `/recipes/new`
- [ ] Fill in title, description, ingredients, instructions
- [ ] Click "Create Recipe"
- [ ] **Expected:** Redirected to `/recipes/[id]`, recipe displays correctly

### Import from URL
- [ ] Navigate to `/recipes/import`
- [ ] Paste a valid recipe URL (e.g., from a cooking site)
- [ ] Click "Import"
- [ ] **Expected:** Recipe data populated in review form
- [ ] Click "Save Recipe"
- [ ] **Expected:** Redirected to `/recipes/[id]`, recipe displays with image (if available)

### Import from Text
- [ ] Navigate to `/recipes/import`
- [ ] Switch to "Paste Text" tab
- [ ] Paste recipe text with ingredients and instructions
- [ ] Click "Parse"
- [ ] **Expected:** Recipe parsed into structured form
- [ ] Click "Save Recipe"
- [ ] **Expected:** Redirected to `/recipes/[id]`

### Edit Recipe
- [ ] Navigate to an existing recipe `/recipes/[id]`
- [ ] Click "Edit" button
- [ ] Modify title or add ingredient
- [ ] Click "Save Changes"
- [ ] **Expected:** Redirected back to recipe detail, changes visible immediately

### Delete Recipe
- [ ] Navigate to `/recipes/[id]/edit`
- [ ] Click "Delete" button
- [ ] Confirm deletion in modal
- [ ] **Expected:** Redirected to `/recipes`, recipe no longer in list

### Recipe List
- [ ] Navigate to `/recipes`
- [ ] **Expected:** All recipes display in grid, images load correctly
- [ ] Empty state shows import/create CTAs (if no recipes)

---

## 3. Recipe Images

### Upload Image
- [ ] Navigate to `/recipes/[id]/edit`
- [ ] Click image upload area
- [ ] Select an image file
- [ ] **Expected:** Image uploads, preview shows immediately

### Image Persistence
- [ ] Navigate away from recipe, then return
- [ ] **Expected:** Uploaded image still displays

### Image in List
- [ ] Navigate to `/recipes`
- [ ] **Expected:** Recipe cards show uploaded/imported images

### Image in Copy/Share
- [ ] Navigate to `/recipes/[id]`
- [ ] Click "Copy" button
- [ ] Paste in a document/app that supports rich text
- [ ] **Expected:** Image URL included in copied content

---

## 4. Stacks

### Create Stack
- [ ] Navigate to `/stacks/new`
- [ ] Enter name and description
- [ ] Click "Create Stack"
- [ ] **Expected:** Redirected to `/stacks/[id]`, stack displays

### Add Recipe to Stack
- [ ] Navigate to `/recipes/[id]`
- [ ] Click "Stacks" button
- [ ] Toggle a stack checkbox ON
- [ ] Close modal
- [ ] Navigate to that stack
- [ ] **Expected:** Recipe appears in stack

### Remove Recipe from Stack
- [ ] Navigate to stack detail `/stacks/[id]`
- [ ] Hover over a recipe card
- [ ] Click remove button (X)
- [ ] **Expected:** Recipe removed from stack immediately

### Edit Stack
- [ ] Navigate to `/stacks/[id]`
- [ ] Click "Edit" button
- [ ] Modify name
- [ ] Click "Save Changes"
- [ ] **Expected:** Stack name updated immediately

### Delete Stack
- [ ] Navigate to `/stacks/[id]`
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] **Expected:** Redirected to `/stacks`, stack no longer in list

### Stack List
- [ ] Navigate to `/stacks`
- [ ] **Expected:** All stacks display with recipe counts
- [ ] Empty state explains what stacks are

---

## 5. Store

### Browse Store
- [ ] Navigate to `/store`
- [ ] **Expected:** Products display in categories
- [ ] Product cards show images, names, tags, prices

### Affiliate Links
- [ ] Click on a product card
- [ ] **Expected:** Opens affiliate link in new tab

### Store for Recipe
- [ ] Navigate to `/recipes/[id]` (recipe with ingredients)
- [ ] Scroll to "Shop ingredients" section (if present)
- [ ] **Expected:** Related store items display

---

## 6. Copy / Share / Print

### Copy Recipe
- [ ] Navigate to `/recipes/[id]`
- [ ] Click "Copy" button
- [ ] Paste in a text editor
- [ ] **Expected:** Recipe text includes title, ingredients, instructions, image URL (if present)

### Share Recipe (create link)
- [ ] Navigate to `/recipes/[id]`
- [ ] Click "Share" button (if no existing share)
- [ ] **Expected:** Share link created and copied to clipboard

### Share Recipe (view shared)
- [ ] Open share link in incognito/different browser
- [ ] **Expected:** Recipe displays publicly (read-only)

### Print Recipe
- [ ] Navigate to `/recipes/[id]`
- [ ] Click "Print" button
- [ ] **Expected:** Print-friendly page opens in new tab

---

## 7. Settings

### View Settings
- [ ] Navigate to `/settings`
- [ ] **Expected:** Profile, Account, Billing, Appearance, Units sections visible

### Update Profile Name
- [ ] Edit first name and last name
- [ ] Click "Save"
- [ ] **Expected:** Name updates, header shows new name

### Change Theme
- [ ] Click Light/Dark/System buttons
- [ ] **Expected:** Theme changes immediately

### Change Unit Preference
- [ ] Select different unit system (Metric/Imperial/Original)
- [ ] Navigate to a recipe
- [ ] **Expected:** Ingredients display in selected unit system

### Billing Section
- [ ] View billing section
- [ ] **Expected:** Current plan displayed (Free/Plus)
- [ ] Upgrade button visible for free users

### Send Feedback
- [ ] Scroll to Feedback section
- [ ] Enter feedback message
- [ ] Click "Send Feedback"
- [ ] **Expected:** Success message appears, textarea clears

---

## 8. Plus Upgrade Flow (if enabled)

### View Upgrade Page
- [ ] Navigate to `/upgrade`
- [ ] **Expected:** Plan comparison displays with current plan highlighted

### Checkout (if active)
- [ ] Click upgrade button
- [ ] **Expected:** Redirected to Stripe Checkout

### Webhook Updates Plan
- [ ] Complete test payment in Stripe
- [ ] **Expected:** Plan updates to Plus in settings/billing

### Manage Billing
- [ ] Navigate to `/settings` → Billing
- [ ] Click "Manage billing"
- [ ] **Expected:** Redirected to Stripe Customer Portal

---

## 9. Mobile Quick Pass

Test on mobile device or browser dev tools (responsive mode):

### Header
- [ ] Logo and navigation visible
- [ ] User menu accessible
- [ ] Menu items work correctly

### Recipes Grid
- [ ] Cards stack in single column on small screens
- [ ] Images scale properly
- [ ] Tap to navigate works

### Recipe Detail
- [ ] All sections readable
- [ ] Action buttons accessible
- [ ] Unit toggle works

### Forms
- [ ] Input fields properly sized
- [ ] Keyboard doesn't obscure inputs
- [ ] Submit buttons accessible

### Modals
- [ ] Modals fit screen
- [ ] Can close/dismiss modals
- [ ] Scrolling works inside modals

---

## 10. Error Handling

### Invalid Route
- [ ] Navigate to `/invalid-page`
- [ ] **Expected:** 404 page displays with navigation back

### Server Error Recovery
- [ ] Trigger error (if testable)
- [ ] **Expected:** Error boundary displays friendly message with retry option

---

## Quick Validation Commands

```bash
# Build check
npm run build

# Type check
npm run type-check

# Lint check
npm run lint

# Local server
npm run dev
```

---

## 11. Feedback System

### Submit Feedback
- [ ] Navigate to `/settings`
- [ ] Scroll to Feedback section
- [ ] Enter a test message
- [ ] Click "Send Feedback"
- [ ] **Expected:** Success message shows

### Verify in Database
- [ ] Open Supabase dashboard → Table Editor → `feedback`
- [ ] **Expected:** New row with your user_id, message, and page_url

### RLS Verification
- [ ] Attempt to insert feedback with different user_id (via SQL editor)
- [ ] **Expected:** Insert fails due to RLS policy

---

## Production Configuration Checklist

Before deploying to production, verify these configurations:

### Supabase Auth

- [ ] **Site URL**: Set to production domain (e.g., `https://mesa.app`)
  - Supabase Dashboard → Authentication → URL Configuration → Site URL
- [ ] **Redirect URLs**: Include all valid redirect destinations
  - Production: `https://mesa.app/**`
  - Preview (if using Vercel): `https://*.vercel.app/**`
  - Local dev: `http://localhost:3000/**`
- [ ] **Email templates**: Customized with your branding (optional but recommended)
- [ ] **OAuth providers** (if enabled): Callback URLs configured correctly

### Supabase Storage

- [ ] **Bucket exists**: `recipe-images` bucket created
- [ ] **Bucket visibility**: Decide public vs private
  - Public: Anyone can read images via URL
  - Private: Requires signed URLs (more complex)
- [ ] **Upload policy**: Only authenticated users can upload
  ```sql
  -- Example policy for uploads
  CREATE POLICY "Users can upload own images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'recipe-images' AND auth.uid()::text = (storage.foldername(name))[1]);
  ```
- [ ] **Read policy**: Configured based on bucket visibility
- [ ] **Database stores paths**: `recipes.image_path` stores path, not signed URLs
- [ ] **Fallback behavior**: App handles missing images gracefully (placeholder shown)

### Supabase Database

- [ ] **RLS enabled**: All user-data tables have RLS enabled
- [ ] **Policies verified**: Users can only access their own data
- [ ] **Migrations applied**: All migrations run in production
  ```bash
  supabase db push
  ```

### Stripe (if billing enabled)

- [ ] **Environment variables set**:
  - `STRIPE_SECRET_KEY` - Live secret key (starts with `sk_live_`)
  - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (starts with `whsec_`)
  - `STRIPE_PRICE_ID_PLUS` - Price ID for Plus plan
- [ ] **Webhook endpoint configured**:
  - URL: `https://mesa.app/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] **Signature verification**: Webhook handler verifies Stripe signature
- [ ] **Test mode disabled**: Using live Stripe keys, not test keys

### Vercel Environment Variables

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

| Variable | Production | Preview | Notes |
|----------|------------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ | Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | `https://mesa.app` | `https://preview.mesa.app` | Used for share links, redirects |
| `STRIPE_SECRET_KEY` | ✓ | ✓ (test key) | Server-only |
| `STRIPE_WEBHOOK_SECRET` | ✓ | ✓ | Server-only |
| `STRIPE_PRICE_ID_PLUS` | ✓ | ✓ | Price ID |

### Security Checklist

- [ ] **No secrets in client code**: All `STRIPE_*` vars are server-only (no `NEXT_PUBLIC_` prefix)
- [ ] **HTTPS only**: Production domain uses HTTPS
- [ ] **Auth cookies secure**: Supabase auth uses secure, httpOnly cookies
- [ ] **Error messages safe**: No sensitive data leaked in error responses
- [ ] **Rate limiting**: Consider adding rate limits to sensitive endpoints

### Pre-Launch Final Checks

- [ ] **Build passes**: `npm run build` completes without errors
- [ ] **Type check passes**: `npm run type-check` (if available)
- [ ] **Lint passes**: `npm run lint`
- [ ] **Smoke test completed**: All items above checked
- [ ] **Mobile tested**: Core flows work on mobile devices
- [ ] **Error boundaries work**: App doesn't white-screen on errors

---

## Notes

- Test in both Chrome and Safari (or Firefox)
- Test with both light and dark mode
- Clear browser cache if seeing stale data
- Check browser console for errors throughout testing
- Read feedback via Supabase Dashboard → Table Editor → `feedback`
