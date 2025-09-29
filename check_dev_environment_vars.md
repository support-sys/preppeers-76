# Development Environment Variables Checklist

## 🚨 CRITICAL: Environment Variables Missing in Development

Based on the code analysis, your development Supabase project (`kqyynigirebbggphstac`) is missing several environment variables that exist in production.

## Required Environment Variables for Development

### 1. Core Supabase Variables (Required by ALL functions)
```
SUPABASE_URL=https://kqyynigirebbggphstac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Payment System Variables (Required by payment functions)
```
CASHFREE_TEST_MODE=true
CASHFREE_APP_ID_TEST=your_test_app_id
CASHFREE_SECRET_KEY_TEST=your_test_secret_key
```

### 3. Google Calendar Integration (Required by schedule-interview)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_private_key_json
```

### 4. Email System (Required by email functions)
```
RESEND_API_KEY=your_resend_api_key
```

### 5. Optional Variables
```
GOOGLE_SHEETS_WEBHOOK_URL=your_google_sheets_webhook_url
```

## How to Add Environment Variables

### Step 1: Go to Supabase Dashboard
```
https://supabase.com/dashboard/project/kqyynigirebbggphstac/settings/functions
```

### Step 2: Add Each Variable
1. Click "Add new secret"
2. Enter the variable name (exactly as shown above)
3. Enter the variable value
4. Click "Add secret"

### Step 3: Copy from Production
If you have access to production, copy these values from:
```
https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/settings/functions
```

## Most Likely Missing Variables (Causing Your Issue)

Based on the error, these are probably missing:

1. **`SUPABASE_URL`** - Required by payment-webhook
2. **`SUPABASE_SERVICE_ROLE_KEY`** - Required by payment-webhook and auto-book-interview
3. **`CASHFREE_APP_ID_TEST`** - Required by create-payment-session
4. **`CASHFREE_SECRET_KEY_TEST`** - Required by create-payment-session

## Quick Test

Add this debug code to your `payment-webhook` function to check what's missing:

```typescript
console.log('=== ENVIRONMENT CHECK ===');
console.log('SUPABASE_URL:', Deno.env.get('SUPABASE_URL') ? '✅' : '❌');
console.log('SUPABASE_SERVICE_ROLE_KEY:', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? '✅' : '❌');
console.log('=== END CHECK ===');
```

## Expected Result After Adding Variables

Once you add the missing environment variables:
1. ✅ Payment webhook will work
2. ✅ Auto-book-interview will work
3. ✅ Complete payment flow will work

**The most likely cause of your issue is missing `SUPABASE_SERVICE_ROLE_KEY` in development.**
