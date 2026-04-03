# OAuth Provider Setup (Google + Apple)

Mesa supports social login via Google and Apple. Both providers are configured through the Supabase Dashboard.

## Prerequisites

- Access to the [Supabase Dashboard](https://supabase.com/dashboard) for your project
- For Google: a [Google Cloud Console](https://console.cloud.google.com/) project
- For Apple: an [Apple Developer](https://developer.apple.com/) account (requires paid membership)

## 1. Supabase Configuration

### Set Site URL

1. Go to **Authentication > URL Configuration** in the Supabase Dashboard
2. Set the **Site URL** to your production URL (e.g., `https://yourdomain.com`)
3. Add redirect URLs:
   - `http://localhost:3000/api/auth/callback` (local development)
   - `https://yourdomain.com/api/auth/callback` (production)

## 2. Google OAuth

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application** as application type
6. Add authorized redirect URIs:
   - `https://<your-supabase-project>.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### Enable in Supabase

1. Go to **Authentication > Providers** in the Supabase Dashboard
2. Enable **Google**
3. Paste the Client ID and Client Secret
4. Save

## 3. Apple OAuth

### Apple Developer Console

1. Go to [Apple Developer > Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources)
2. Create a **Services ID** (this is your Client ID):
   - Register a new identifier with type **Services IDs**
   - Enable **Sign in with Apple**
   - Configure the web domain and return URL:
     - Domain: `<your-supabase-project>.supabase.co`
     - Return URL: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
3. Create a **Key** for Sign in with Apple:
   - Register a new key, enable **Sign in with Apple**
   - Download the `.p8` key file (you can only download it once)
   - Note the **Key ID**

### Enable in Supabase

1. Go to **Authentication > Providers** in the Supabase Dashboard
2. Enable **Apple**
3. Enter:
   - **Client ID**: Your Services ID (e.g., `com.yourdomain.mesa`)
   - **Secret Key**: Contents of the `.p8` file
   - **Key ID**: From the Apple Developer Console
   - **Team ID**: Your Apple Developer Team ID (found in Membership details)
4. Save

## 4. Environment Variables

No additional environment variables are needed in the app. OAuth is configured entirely through the Supabase Dashboard. The app uses `NEXT_PUBLIC_APP_URL` (already configured) for the OAuth redirect callback.

## Account Linking

Supabase's default behavior automatically links OAuth identities to existing accounts when the email address matches **and** is verified on both sides. This means:

- A user who signed up with email/password can later sign in with Google (same email) and it will link to the same account
- If the OAuth provider does not verify the email, Supabase may create a separate account

## Troubleshooting

- **Redirect mismatch error**: Ensure the callback URL in your OAuth provider matches exactly: `https://<project>.supabase.co/auth/v1/callback`
- **"auth_callback_error" on login page**: The code exchange failed. Check Supabase logs under **Authentication > Logs**
- **Missing name after OAuth signup**: Verify the trigger migration (`0020_oauth_profile_metadata.sql`) has been applied. Check with: `SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';`
