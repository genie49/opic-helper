# Google OAuth Authentication Setup

## 1. Supabase Dashboard Configuration

### Enable Google OAuth Provider

1. Go to Supabase Dashboard → Authentication → Providers
2. Find "Google" and enable it
3. Configure the OAuth settings:

```
Authorized Client IDs: (Google Cloud Console에서 생성)
```

### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External
   - App name: OPIc Helper
   - User support email: your-email@example.com
   - Authorized domains: your-domain.com
   - Developer contact: your-email@example.com

6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: OPIc Helper Web Client
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://your-production-domain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/auth/callback
     https://bvnkditlhsdfizduafus.supabase.co/auth/v1/callback
     https://your-production-domain.com/auth/callback
     ```

7. Copy the Client ID and Client Secret
8. Add them to Supabase Google Provider settings

## 2. Environment Variables

Already configured in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://bvnkditlhsdfizduafus.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_jftOX09SN3jn0JoPcvgI8w_Q1cFaiga
```

## 3. Authentication Flow

### Login Flow
```
1. User clicks "Google로 로그인" button
2. signInWithOAuth({ provider: 'google' }) called
3. Redirects to Google OAuth consent screen
4. User approves access
5. Google redirects to /auth/callback
6. Supabase exchanges code for session
7. User redirected to /dashboard
```

### Logout Flow
```
1. User clicks logout button
2. supabase.auth.signOut() called
3. Session cleared from cookies
4. User redirected to landing page (/)
```

## 4. Protected Routes

All routes under `(dashboard)` group require authentication:
- `/dashboard`
- `/practice`
- `/roleplay`
- `/history`

Middleware automatically:
- Refreshes session on each request
- Redirects unauthenticated users to `/login`
- Updates cookies with new session data

## 5. User Profile Creation

After first login, create user profile in `user_profiles` table:

```typescript
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  // Check if profile exists
  const profile = await db.select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id))
    .limit(1);

  if (profile.length === 0) {
    // Create new profile
    await db.insert(userProfiles).values({
      userId: user.id,
      displayName: user.user_metadata.full_name || user.email?.split('@')[0],
      email: user.email,
      avatarUrl: user.user_metadata.avatar_url,
    });
  }
}
```

## 6. Testing Checklist

- [ ] Google OAuth provider enabled in Supabase
- [ ] Client ID and Secret configured
- [ ] Redirect URIs added to Google Cloud Console
- [ ] Login page accessible at `/login`
- [ ] Google login button works
- [ ] Callback handler at `/auth/callback` works
- [ ] Session persists after login
- [ ] Dashboard routes require authentication
- [ ] User profile created on first login
- [ ] Logout functionality works
- [ ] Redirects work correctly (login → dashboard, logout → home)

## 7. Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side
- Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` for client operations
- Middleware handles session refresh automatically
- RLS policies protect database tables
- OAuth tokens stored securely in HTTP-only cookies
