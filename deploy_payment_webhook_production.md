# Deploy payment-webhook to Production

## 🎯 Goal
Deploy the updated `payment-webhook` function to production and update the Cashfree webhook URL.

## 📋 Steps to Deploy

### Step 1: Deploy the Function to Production

1. **Go to Supabase Production Dashboard:**
   ```
   https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions
   ```

2. **Create New Function:**
   - Click "Create a new function"
   - Name it: `payment-webhook` (with hyphen, not underscore)

3. **Copy the Updated Code:**
   - Copy the entire content from `supabase/functions/payment-webhook/index.ts`
   - Paste it into the new function editor

4. **Deploy the Function:**
   - Click "Deploy" to save and activate the function

### Step 2: Update Cashfree Webhook URL

1. **Go to Cashfree Dashboard:**
   - **Production:** https://merchant.cashfree.com/merchant/pg/webhooks
   - **Test:** https://sandbox.cashfree.com/merchant/pg/webhooks

2. **Update Webhook URL:**
   - **Old URL:** `https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment_webhook_v1`
   - **New URL:** `https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook`

3. **Verify Settings:**
   - ✅ Webhook URL: `https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook`
   - ✅ Events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`
   - ✅ Status: Active

### Step 3: Test the New Webhook

1. **Make a Test Payment:**
   - Use a test card or complete a small payment
   - Verify the webhook is called successfully

2. **Check Logs:**
   - Go to Supabase Dashboard → Functions → `payment-webhook`
   - Check the logs to ensure it's processing correctly

3. **Verify Auto-Booking:**
   - Confirm that `auto-book-interview` is triggered
   - Check that the interview gets scheduled

## 🔧 Key Features in the New payment-webhook

The new `payment-webhook` function includes:

### ✅ Authentication Headers
```typescript
const autoBookResponse = await supabase.functions.invoke('auto-book-interview', {
  body: { payment_session_id: sessionId, user_id: paymentSession.user_id },
  headers: {
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'apikey': supabaseServiceKey
  }
});
```

### ✅ Better Error Handling
- Comprehensive logging
- Proper error responses
- Graceful failure handling

### ✅ Add-ons Support
- Processes add-ons data from payment sessions
- Passes add-ons information to auto-booking

## 🚨 Important Notes

### 1. **Keep Old Function Temporarily**
- Don't delete `payment_webhook_v1` immediately
- Keep it as backup until you confirm the new one works

### 2. **Environment Variables**
Ensure these are set in production:
- `SUPABASE_URL=https://jhhoeodofsbgfxndhotq.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`

### 3. **Dependencies**
The new `payment-webhook` calls `auto-book-interview`, so make sure:
- `auto-book-interview` function is also updated in production
- All authentication headers are properly configured

## 🧪 Testing Checklist

After deployment, test these scenarios:

### ✅ Successful Payment
- [ ] Payment completes successfully
- [ ] Webhook receives payment data
- [ ] Auto-booking is triggered
- [ ] Interview gets scheduled

### ✅ Failed Payment
- [ ] Failed payment is handled correctly
- [ ] Payment session is marked as failed
- [ ] No auto-booking is attempted

### ✅ Duplicate Payments
- [ ] Duplicate webhooks are handled gracefully
- [ ] No duplicate interviews are created

## 🔄 Rollback Plan

If issues occur:

1. **Revert Cashfree Webhook URL:**
   - Change back to: `https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment_webhook_v1`

2. **Keep Both Functions:**
   - `payment_webhook_v1` (old, working)
   - `payment-webhook` (new, being tested)

3. **Debug Issues:**
   - Check function logs
   - Verify environment variables
   - Test authentication

## 📊 Expected Benefits

After successful deployment:

- ✅ **Better Reliability:** Proper authentication prevents 401 errors
- ✅ **Faster Processing:** Optimized webhook handling
- ✅ **Add-ons Support:** Complete add-ons integration
- ✅ **Better Logging:** Enhanced debugging capabilities
- ✅ **Future-Proof:** Latest codebase with all improvements

## 🎉 Success Criteria

The deployment is successful when:
- [ ] New webhook URL is active in Cashfree
- [ ] Test payments trigger webhooks successfully
- [ ] Auto-booking works without 401 errors
- [ ] Interviews are scheduled correctly
- [ ] All logs show successful processing

**Ready to deploy! Let me know when you've completed the deployment and I can help with testing.**
