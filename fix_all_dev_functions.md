# Fix All Development Edge Functions

## 🚨 CRITICAL: Multiple Functions Failing Due to Missing Environment Variables

### Functions Currently Failing:
1. ❌ `find-matching-interviewer` - 401 Unauthorized
2. ❌ `auto-book-interview` - 401 Unauthorized (when called from webhook)
3. ❌ `payment-webhook` - Authentication issues
4. ❌ `create-payment-session` - Likely missing Cashfree credentials

### Root Cause:
**Development Supabase project is missing environment variables that exist in production.**

## Required Environment Variables for Development

### Go to Supabase Dashboard:
```
https://supabase.com/dashboard/project/kqyynigirebbggphstac/settings/functions
```

### Add These Variables:

#### 1. Core Supabase Variables (Required by ALL functions)
```
SUPABASE_URL=https://kqyynigirebbggphstac.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### 2. Payment System Variables
```
CASHFREE_TEST_MODE=true
CASHFREE_APP_ID_TEST=your_test_app_id
CASHFREE_SECRET_KEY_TEST=your_test_secret_key
```

#### 3. Google Calendar Integration
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_private_key_json
```

#### 4. Email System
```
RESEND_API_KEY=your_resend_api_key
```

## How to Get the Values

### Option 1: Copy from Production
If you have access to production:
```
https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/settings/functions
```

### Option 2: Get from Supabase Dashboard
1. Go to your development project settings
2. Go to "API" section
3. Copy the "Service Role Key" for `SUPABASE_SERVICE_ROLE_KEY`
4. Copy the "Project URL" for `SUPABASE_URL`

### Option 3: Generate New Keys
For Cashfree:
1. Go to Cashfree dashboard (sandbox mode)
2. Get test credentials
3. Add them to Supabase

## Expected Result After Adding Variables

Once you add the missing environment variables:
1. ✅ `find-matching-interviewer` will work
2. ✅ `auto-book-interview` will work  
3. ✅ `payment-webhook` will work
4. ✅ `create-payment-session` will work
5. ✅ Complete payment flow will work

## Quick Test

After adding variables, test each function:

```bash
# Test find-matching-interviewer
curl -X POST "https://kqyynigirebbggphstac.supabase.co/functions/v1/find-matching-interviewer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"test": true}'

# Test payment-webhook
curl -X POST "https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

## Most Critical Variables to Add First

1. **`SUPABASE_SERVICE_ROLE_KEY`** - This is likely the main issue
2. **`SUPABASE_URL`** - Required by all functions
3. **`CASHFREE_APP_ID_TEST`** - Required for payments
4. **`CASHFREE_SECRET_KEY_TEST`** - Required for payments

**The missing `SUPABASE_SERVICE_ROLE_KEY` is probably causing most of the 401 errors.**
