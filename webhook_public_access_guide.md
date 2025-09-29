# Making Supabase Edge Functions Publicly Accessible

## Problem
Cashfree webhooks are failing with `401 Missing authorization header` because Supabase edge functions require authentication by default.

## Solution Options

### Option 1: Enable Anonymous Access in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/kqyynigirebbggphstac/functions
   ```

2. **Find the `payment-webhook` function**

3. **Look for these settings:**
   - ✅ **"Allow anonymous access"** toggle
   - ✅ **"Public"** toggle
   - ✅ **"Authentication required"** (should be OFF)

4. **Enable anonymous access if available**

### Option 2: Check Function Configuration

If you can't find the anonymous access toggle, check:

1. **Function Settings:**
   - Go to the function details page
   - Look for "Authentication" or "Security" settings
   - Enable "Allow unauthenticated requests"

2. **Project Settings:**
   - Go to Project Settings → API
   - Check if there are global settings for edge function authentication

### Option 3: Modify Function Code (If needed)

If the above doesn't work, we may need to modify the function to handle authentication differently.

## Testing After Changes

Once you've enabled anonymous access:

```bash
# Test the webhook
node test_cashfree_webhook.js

# Or test with curl
curl -X POST "https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

## Cashfree Webhook Configuration

After fixing the authentication, configure Cashfree:

1. **Go to Cashfree Dashboard:**
   - Test: https://sandbox.cashfree.com/merchant/pg/webhooks
   - Prod: https://merchant.cashfree.com/merchants/pg/developers/webhooks

2. **Add Webhook URL:**
   ```
   https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook
   ```

3. **Enable Events:**
   - ✅ `PAYMENT_SUCCESS_WEBHOOK`
   - ✅ `PAYMENT_FAILED_WEBHOOK`

## Expected Flow After Fix

1. ✅ User completes payment in Cashfree
2. ✅ Cashfree sends webhook to your Supabase function
3. ✅ `payment-webhook` processes the webhook
4. ✅ `auto-book-interview` gets triggered
5. ✅ Interview gets scheduled automatically
