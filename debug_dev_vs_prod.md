# Debug Development vs Production Differences

## Common Issues When Code Works in Production but Not Development

### 1. Environment Variables Missing in Development

**Check these environment variables in your development Supabase project:**

#### Required for `payment-webhook` function:
```
SUPABASE_URL=https://kqyynigirebbggphstac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Required for `auto-book-interview` function:
```
SUPABASE_URL=https://kqyynigirebbggphstac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Required for `create-payment-session` function:
```
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
CASHFREE_ENVIRONMENT=sandbox
```

### 2. Check Environment Variables in Supabase Dashboard

1. **Go to:** https://supabase.com/dashboard/project/kqyynigirebbggphstac/settings/functions
2. **Verify these variables exist:**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CASHFREE_APP_ID`
   - `CASHFREE_SECRET_KEY`
   - `CASHFREE_ENVIRONMENT`

### 3. Compare with Production

**Production project:** `jhhoeodofsbgfxndhotq`
**Development project:** `kqyynigirebbggphstac`

Make sure both projects have the same environment variables set.

### 4. Test Environment Variables

Add this debug code to your `payment-webhook` function temporarily:

```typescript
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL'));
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
console.log('SERVICE_KEY length:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length || 0);
console.log('=== END DEBUG ===');
```

### 5. Common Differences

#### A. Service Role Key Format
- **Production:** Usually starts with `eyJ...` (JWT format)
- **Development:** Should be identical format

#### B. URL Differences
- **Production:** `https://jhhoeodofsbgfxndhotq.supabase.co`
- **Development:** `https://kqyynigirebbggphstac.supabase.co`

#### C. Cashfree Credentials
- **Production:** Live credentials
- **Development:** Test/sandbox credentials

### 6. Quick Fix Steps

1. **Copy environment variables from production to development**
2. **Update URLs to match development project**
3. **Ensure Cashfree is in sandbox mode for development**
4. **Redeploy functions after updating environment variables**

### 7. Test the Fix

After updating environment variables:

```bash
# Test webhook
curl -X POST "https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```
