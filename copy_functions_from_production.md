# Copy Edge Functions from Production to Development

## Production Project: jhhoeodofsbgfxndhotq (Interviewmock)
## Development Project: kqyynigirebbggphstac (Interviewmock-dev)

## Functions to Copy:

### 1. auto-book-interview
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/auto-book-interview
- **Local Path:** `supabase/functions/auto-book-interview/index.ts`
- **Status:** ✅ Already updated with add-ons support

### 2. schedule-interview  
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/schedule-interview
- **Local Path:** `supabase/functions/schedule-interview/index.ts`
- **Status:** ✅ Already updated with add-ons support

### 3. payment-webhook
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/payment-webhook
- **Local Path:** `supabase/functions/payment-webhook/index.ts`
- **Status:** ✅ Already updated with add-ons support

### 4. create-payment-session
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/create-payment-session
- **Local Path:** `supabase/functions/create-payment-session/index.ts`
- **Status:** ✅ Already updated with add-ons support

### 5. send-interview-emails
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/send-interview-emails
- **Local Path:** `supabase/functions/send-interview-emails/index.ts`
- **Status:** ✅ Already perfect, no changes needed

### 6. find-matching-interviewer
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/find-matching-interviewer
- **Local Path:** `supabase/functions/find-matching-interviewer/index.ts`
- **Status:** ⚠️ Need to copy from production

### 7. try-previewed-interviewer
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/try-previewed-interviewer
- **Local Path:** `supabase/functions/try-previewed-interviewer/index.ts`
- **Status:** ⚠️ Need to copy from production

### 8. create-google-meet
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/create-google-meet
- **Local Path:** `supabase/functions/create-google-meet/index.ts`
- **Status:** ⚠️ Need to copy from production

### 9. sync-to-sheets
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/sync-to-sheets
- **Local Path:** `supabase/functions/sync-to-sheets/index.ts`
- **Status:** ⚠️ Need to copy from production

### 10. send-interviewer-welcome
- **Production URL:** https://supabase.com/dashboard/project/jhhoeodofsbgfxndhotq/functions/send-interviewer-welcome
- **Local Path:** `supabase/functions/send-interviewer-welcome/index.ts`
- **Status:** ⚠️ Need to copy from production

## Copy Process:

1. **Click on each function URL above**
2. **Click "Edit" in the function dashboard**
3. **Copy all the code**
4. **Paste into the corresponding local file**
5. **Save the file**

## After Copying:

1. **Deploy to development:**
   ```bash
   supabase functions deploy --project-ref kqyynigirebbggphstac
   ```

2. **Or deploy individual functions:**
   ```bash
   supabase functions deploy function-name --project-ref kqyynigirebbggphstac
   ```

## Notes:

- ✅ Functions 1-5 already have add-ons support integrated
- ⚠️ Functions 6-10 need to be copied from production
- 🔄 After copying, you may want to integrate add-ons support into functions 6-10 if needed

## Environment Variables:

Make sure these are set in your development project:
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY` 
- `CASHFREE_TEST_MODE=true`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PROJECT_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `RESEND_API_KEY`

