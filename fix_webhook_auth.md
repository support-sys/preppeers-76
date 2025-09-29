# Fix Webhook Authentication Issue

## Problem Confirmed ✅
- Cashfree is successfully sending webhooks
- Your Supabase function is rejecting them with `401 UNAUTHORIZED`
- This prevents `auto-book-interview` from triggering

## Solution: Enable Anonymous Access

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/kqyynigirebbggphstac/functions
   ```

2. **Find the `payment-webhook` function**

3. **Look for these settings:**
   - 🔍 "Allow anonymous access" toggle
   - 🔍 "Public" toggle  
   - 🔍 "Authentication required" (should be OFF)
   - 🔍 "Require authentication" (should be OFF)

### Option 2: Function Configuration

If you can't find the toggle, check:

1. **Function Settings Page:**
   - Click on the `payment-webhook` function
   - Look for "Security" or "Authentication" settings
   - Enable "Allow unauthenticated requests"

2. **Project Settings:**
   - Go to Project Settings → API
   - Check global edge function authentication settings

### Option 3: Redeploy Function (If needed)

If the above doesn't work, we may need to redeploy the function with different settings:

```bash
# Redeploy the function
supabase functions deploy payment-webhook --project-ref kqyynigirebbggphstac
```

## Testing After Fix

Once anonymous access is enabled:

```bash
# Test with curl
curl -X POST "https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'

# Should return 200 OK instead of 401 UNAUTHORIZED
```

## Expected Result

After fixing authentication:
1. ✅ Cashfree sends webhook
2. ✅ Supabase function accepts it (200 OK)
3. ✅ `payment-webhook` processes the payment
4. ✅ `auto-book-interview` gets triggered
5. ✅ Interview gets scheduled automatically

## Cashfree Webhook Configuration

Make sure Cashfree is configured correctly:
- **Test Environment:** https://sandbox.cashfree.com/merchant/pg/webhooks
- **Webhook URL:** `https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook`
- **Events:** `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`
