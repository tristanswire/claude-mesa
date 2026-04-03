# Supabase Production Setup — Mesa

Project ref: `xsjktoeqhmdxnelkloct`
Dashboard: https://supabase.com/dashboard/project/xsjktoeqhmdxnelkloct

---

## 1. Authentication → URL Configuration

**Dashboard → Authentication → URL Configuration**

| Field | Value |
|---|---|
| Site URL | `https://your-production-domain.com` |
| Redirect URLs | Add `https://your-production-domain.com/api/auth/callback` |

> The redirect URL must exactly match what the app sends in the OAuth flow.
> The code uses: `${NEXT_PUBLIC_APP_URL}/api/auth/callback`

---

## 2. Authentication → Email Settings

By default Supabase disables email confirmation in development. **Turn it back on for production.**

**Dashboard → Authentication → Providers → Email**

- [ ] Enable **Confirm email** toggle
- [ ] Set up a custom SMTP provider (Supabase's built-in rate limit is 3 emails/hour)

### Recommended: Resend (resend.com)

1. Create account at resend.com
2. Add and verify your domain (e.g. `mail.trymesa.app`)
3. Create an API key
4. In Supabase Dashboard → Project Settings → Auth → SMTP Settings:

| Field | Value |
|---|---|
| Enable custom SMTP | On |
| Sender name | Mesa |
| Sender email | `noreply@your-domain.com` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key |

> Resend free tier: 3,000 emails/month, 100/day. Sufficient for beta.

---

## 3. Authentication → OAuth Providers

**Dashboard → Authentication → Providers**

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Open your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://xsjktoeqhmdxnelkloct.supabase.co/auth/v1/callback
   ```
   (This is the Supabase callback URL — already added if working in dev. Confirm it's there for prod.)
4. No changes needed in Supabase dashboard for existing Google OAuth setup.

### Apple OAuth

1. In Apple Developer → Certificates, Identifiers & Profiles → your Services ID:
2. Under **Sign in with Apple**, edit the configuration
3. Add to **Return URLs**:
   ```
   https://xsjktoeqhmdxnelkloct.supabase.co/auth/v1/callback
   ```

---

## 4. Storage

**Dashboard → Storage**

- [ ] Confirm the `recipe-images` bucket exists
- [ ] Confirm RLS policy allows: authenticated users can INSERT/SELECT their own images
- [ ] Confirm public read is enabled for the bucket (recipe images are displayed publicly in the app)

To verify RLS policies on storage, run in SQL Editor:
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'recipe-images';
```

---

## 5. Database

### Apply all migrations

Run from your local project:
```bash
supabase db push
```

Or apply each migration manually via Dashboard → SQL Editor in order:
- `0001` through `0021` (check `supabase/migrations/` for the full list)

### Confirm RLS is enabled

Run in SQL Editor to verify all user-data tables have RLS enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### Confirm handle_new_user trigger

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Should return one row with `event_object_table = users`.

### Reload schema cache

After applying migrations:
**Dashboard → Settings → API → Reload schema cache**

This ensures PostgREST picks up any new columns immediately.

---

## 6. Post-deployment verification

After deploying to Vercel, verify:

```
GET https://your-production-domain.com/api/health
```

Expected response:
```json
{
  "ok": true,
  "supabase": { "connected": true, "latencyMs": <number> }
}
```
