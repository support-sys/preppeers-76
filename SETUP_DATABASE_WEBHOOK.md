# Database Webhook Setup Guide (Option 2)

## Step-by-Step Setup Instructions

### Step 1: Get Your n8n Webhook URL

1. Open your n8n instance
2. Create a new workflow
3. Add a **Webhook** node
4. Configure:
   - **HTTP Method**: `POST`
   - **Path**: `/resume-review` (or any path you prefer)
   - **Response Mode**: "Respond to Webhook"
5. **Copy the webhook URL** (e.g., `https://your-n8n-instance.com/webhook/resume-review`)
6. **Save the workflow** (but don't activate it yet - we'll test first)

---

### Step 2: Deploy Edge Function

1. **Open terminal** in your project directory

2. **Login to Supabase** (if not already logged in):
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref kqyynigirebbggphstac
   ```

4. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy resume-review-webhook
   ```

5. **Verify deployment**: Check Supabase Dashboard → Edge Functions → `resume-review-webhook`

---

### Step 3: Set n8n Webhook URL as Secret

1. **Set the secret** in Supabase:
   ```bash
   supabase secrets set N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/resume-review
   ```
   ⚠️ **Replace** `https://your-n8n-instance.com/webhook/resume-review` with your actual n8n webhook URL

2. **Verify secret is set**:
   ```bash
   supabase secrets list
   ```
   You should see `N8N_WEBHOOK_URL` in the list

---

### Step 4: Create Database Webhook in Supabase Dashboard

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/kqyynigirebbggphstac

2. **Navigate to Database Webhooks**:
   - Click **Database** in left sidebar
   - Click **Webhooks** tab
   - Click **"Create a new webhook"** button

3. **Configure the webhook**:
   - **Name**: `Resume Review to n8n`
   - **Table**: Select `resume_reviews` from dropdown
   - **Events**: Check ✅ `INSERT` (uncheck others)
   - **Type**: Select `HTTP Request`
   - **URL**: `https://kqyynigirebbggphstac.supabase.co/functions/v1/resume-review-webhook`
   - **HTTP Method**: `POST`
   - **HTTP Headers**: Click "Add header" and add:
     - **Key**: `Authorization`
     - **Value**: `Bearer YOUR_SERVICE_ROLE_KEY`
       - Get this from: Settings → API → service_role key (secret)
   - **HTTP Headers**: Add another header:
     - **Key**: `Content-Type`
     - **Value**: `application/json`

4. **Click "Create webhook"**

---

### Step 5: Test the Setup

1. **Activate your n8n workflow** (click the "Active" toggle)

2. **Submit a test resume**:
   - Go to `/resume-review` on your website
   - Fill out the form and submit

3. **Check n8n**:
   - Your webhook node should receive the payload immediately
   - Check the payload structure matches expected format

4. **Check Edge Function logs**:
   - Go to Supabase Dashboard → Edge Functions → `resume-review-webhook`
   - Click **"Logs"** tab
   - You should see logs showing:
     - "Received database webhook payload"
     - "Forwarding to n8n webhook"
     - "n8n webhook response"

5. **Check Database Webhook logs**:
   - Go to Database → Webhooks
   - Click on your webhook
   - Check the "Recent deliveries" section
   - Should show successful requests

---

### Step 6: Verify Database Trigger

The database trigger should already be set up by the migration. Verify it exists:

```sql
-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'resume_reviews'
AND trigger_name = 'trigger_resume_review_webhook_trigger';
```

---

## Troubleshooting

### Issue: Edge Function not receiving webhooks

**Check**:
1. Is the Edge Function deployed? (Dashboard → Edge Functions)
2. Is the Database Webhook created and enabled? (Database → Webhooks)
3. Check Database Webhook URL is correct
4. Check Authorization header has correct service_role key

**Solution**:
- Verify the webhook URL in Database Webhooks matches: `https://kqyynigirebbggphstac.supabase.co/functions/v1/resume-review-webhook`
- Check Edge Function logs for errors

### Issue: n8n not receiving webhooks

**Check**:
1. Is `N8N_WEBHOOK_URL` secret set correctly?
2. Is n8n workflow active?
3. Check Edge Function logs for n8n call errors

**Solution**:
- Verify secret: `supabase secrets list`
- Test n8n webhook URL manually with curl:
  ```bash
  curl -X POST https://your-n8n-instance.com/webhook/resume-review \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```

### Issue: Webhook called but wrong payload format

**Check Edge Function logs** to see the actual payload format

**Solution**: The Edge Function handles multiple formats, but if you see issues, check the logs and we can adjust

---

## Expected Flow

```
1. User submits resume
   ↓
2. INSERT into resume_reviews (status='pending')
   ↓
3. Database trigger fires → Updates webhook_triggered_at
   ↓
4. Database Webhook sends HTTP request to Edge Function
   ↓
5. Edge Function receives payload → Extracts record data
   ↓
6. Edge Function calls n8n webhook with formatted payload
   ↓
7. n8n receives webhook → Processes resume → Generates report → Sends email
```

---

## Next Steps

After webhook is working:
1. Complete your n8n workflow (see `N8N_INTEGRATION_GUIDE.md`)
2. Test end-to-end flow
3. Monitor conversion rates

---

## Quick Reference

**Edge Function URL**: `https://kqyynigirebbggphstac.supabase.co/functions/v1/resume-review-webhook`

**Set Secret**:
```bash
supabase secrets set N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/resume-review
```

**Deploy Function**:
```bash
supabase functions deploy resume-review-webhook
```

**Check Logs**:
- Edge Function: Dashboard → Edge Functions → resume-review-webhook → Logs
- Database Webhook: Database → Webhooks → Resume Review to n8n → Recent deliveries


