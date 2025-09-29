# Cashfree Configuration Check

## Required Environment Variables in Supabase Dashboard:

### For Development (Test Mode):
```
CASHFREE_TEST_MODE=true
CASHFREE_APP_ID_TEST=your_test_app_id
CASHFREE_SECRET_KEY_TEST=your_test_secret_key
```

### For Production:
```
CASHFREE_TEST_MODE=false
CASHFREE_APP_ID=your_prod_app_id
CASHFREE_SECRET_KEY=your_prod_secret_key
```

## How to Check/Set Environment Variables:

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/kqyynigirebbggphstac/settings/functions

2. **Add Environment Variables:**
   - Click "Add new secret"
   - Add each variable above

## Webhook Configuration in Cashfree:

### Test Mode (Sandbox):
1. Go to: https://sandbox.cashfree.com/merchant/pg/webhooks
2. Set webhook URL: `https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook`
3. Enable events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`

### Production Mode:
1. Go to: https://merchant.cashfree.com/merchant/pg/webhooks
2. Set webhook URL: `https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook`
3. Enable events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`

## Manual Testing:

Run the test script to verify webhook works:
```bash
node test_webhook_manual.js
```
