# Deploy Webhook Authentication Fix

## Problem Fixed ✅
The `payment-webhook` function was calling `auto-book-interview` without proper authentication headers.

## Solution Applied ✅
Updated the `payment-webhook` function to include authentication headers when calling `auto-book-interview`:

```typescript
const autoBookResponse = await supabase.functions.invoke('auto-book-interview', {
  body: {
    payment_session_id: sessionId,
    user_id: paymentSession.user_id
  },
  headers: {
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'apikey': supabaseServiceKey
  }
});
```

## Manual Deployment Required

Since we can't deploy via CLI, you need to manually update the function in Supabase Dashboard:

### Step 1: Copy Updated Code
The updated `payment-webhook/index.ts` file has been modified locally. You need to copy this code to your Supabase dashboard.

### Step 2: Update in Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/kqyynigirebbggphstac/functions
2. Find the `payment-webhook` function
3. Click "Edit" or "Deploy"
4. Replace the code with the updated version
5. Deploy the function

### Step 3: Test the Fix
After deployment, test a payment flow:

1. Complete a test payment
2. Check that the webhook is processed successfully
3. Verify that `auto-book-interview` is triggered without 401 errors
4. Confirm that the interview gets scheduled automatically

## Expected Result
After this fix:
1. ✅ Payment webhook processes successfully
2. ✅ Auto-book-interview gets triggered with proper authentication
3. ✅ Interview gets scheduled automatically
4. ✅ Complete end-to-end flow works

## Alternative: Use Supabase CLI
If you have access to Supabase CLI with authentication:

```bash
# Set your access token
export SUPABASE_ACCESS_TOKEN=your_access_token_here

# Deploy the function
supabase functions deploy payment-webhook --project-ref kqyynigirebbggphstac
```
