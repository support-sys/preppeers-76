# Fix Authentication Headers in Edge Functions

## 🎯 Problem Solved

The issue was that edge functions were calling other edge functions using `supabaseClient.functions.invoke()` but **not passing authentication headers**. This caused `401 Unauthorized` errors.

## ✅ Functions Fixed

### 1. `payment-webhook` → `auto-book-interview`
**File:** `supabase/functions/payment-webhook/index.ts`
**Fix:** Added authentication headers when calling `auto-book-interview`

```typescript
const autoBookResponse = await supabase.functions.invoke('auto-book-interview', {
  body: { ... },
  headers: {
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'apikey': supabaseServiceKey
  }
});
```

### 2. `auto-book-interview` → `find-matching-interviewer`
**File:** `supabase/functions/auto-book-interview/index.ts`
**Fix:** Added authentication headers when calling `find-matching-interviewer`

```typescript
const matchingResponse = await supabaseClient.functions.invoke('find-matching-interviewer', {
  body: { ... },
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  }
});
```

### 3. `auto-book-interview` → `schedule-interview`
**File:** `supabase/functions/auto-book-interview/index.ts`
**Fix:** Added authentication headers when calling `schedule-interview`

```typescript
const scheduleResponse = await supabaseClient.functions.invoke('schedule-interview', {
  body: { ... },
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  }
});
```

## 🚀 Deployment Required

You need to deploy the updated functions to your development Supabase project:

### Step 1: Deploy `payment-webhook`
1. Go to: https://supabase.com/dashboard/project/kqyynigirebbggphstac/functions
2. Find `payment-webhook` function
3. Replace the code with the updated version
4. Deploy

### Step 2: Deploy `auto-book-interview`
1. Find `auto-book-interview` function
2. Replace the code with the updated version
3. Deploy

## 🧪 Expected Result After Deployment

Once deployed, the complete flow should work:

1. ✅ User completes payment
2. ✅ Cashfree sends webhook to `payment-webhook`
3. ✅ `payment-webhook` processes payment and calls `auto-book-interview`
4. ✅ `auto-book-interview` calls `find-matching-interviewer` (with auth headers)
5. ✅ `auto-book-interview` calls `schedule-interview` (with auth headers)
6. ✅ Interview gets scheduled automatically

## 🔍 Root Cause

The issue was that when edge functions call other edge functions using `supabaseClient.functions.invoke()`, they need to pass the service role key in the headers for authentication. Without these headers, the called functions return `401 Unauthorized`.

## 📝 Key Learning

**When edge functions call other edge functions:**
- ✅ Use service role key for authentication
- ✅ Pass `Authorization: Bearer {service_role_key}` header
- ✅ Pass `apikey: {service_role_key}` header
- ❌ Don't rely on the client's authentication context

This is why the code worked in production (where functions might have different authentication settings) but failed in development.
