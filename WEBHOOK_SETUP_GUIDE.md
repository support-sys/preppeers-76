# Resume Review Webhook Setup Guide

## Quick Setup (Choose One Method)

### Method 1: pg_net Extension (Fastest - Direct HTTP Call) ⚡

**Prerequisites**: pg_net extension must be enabled in Supabase

1. **Enable pg_net extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. **Get your n8n webhook URL**:
   - Create a webhook node in n8n
   - Copy the webhook URL (e.g., `https://your-n8n-instance.com/webhook/resume-review`)

3. **Set webhook URL in Supabase**:
   ```sql
   ALTER DATABASE postgres SET app.n8n_webhook_url = 'https://your-n8n-instance.com/webhook/resume-review';
   ```

4. **Test**: Submit a resume and check n8n - webhook should be called instantly!

**✅ Advantages**: 
- Direct HTTP call from database
- No intermediate steps
- Fastest method

**❌ Disadvantages**:
- Requires pg_net extension (may not be available in all Supabase projects)

---

### Method 2: Supabase Database Webhooks + Edge Function (Most Reliable) 🎯

**Prerequisites**: None (works in all Supabase projects)

1. **Deploy Edge Function**:
   ```bash
   cd supabase
   supabase functions deploy resume-review-webhook
   ```

2. **Set n8n webhook URL as secret**:
   ```bash
   supabase secrets set N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/resume-review
   ```

3. **Create Database Webhook in Supabase Dashboard**:
   - Go to **Database** → **Webhooks**
   - Click **"Create a new webhook"**
   - Configure:
     - **Name**: `Resume Review to n8n`
     - **Table**: `resume_reviews`
     - **Events**: `INSERT` ✅
     - **Type**: `HTTP Request`
     - **URL**: `https://{your-project-ref}.supabase.co/functions/v1/resume-review-webhook`
     - **HTTP Method**: `POST`
     - **HTTP Headers**: 
       ```json
       {
         "Authorization": "Bearer {your-service-role-key}",
         "Content-Type": "application/json"
       }
       ```
   - Click **"Create webhook"**

4. **Test**: Submit a resume and check n8n - webhook should be called instantly!

**✅ Advantages**:
- Works in all Supabase projects
- No extension dependencies
- More control and logging
- Can add authentication/validation

**❌ Disadvantages**:
- Requires Edge Function deployment
- Slightly more setup steps

---

## Testing the Webhook

### Test 1: Submit a Resume
1. Go to `/resume-review`
2. Fill out the form and submit
3. Check n8n webhook node - should receive payload immediately

### Test 2: Check Database
```sql
SELECT 
  id,
  user_email,
  status,
  webhook_triggered_at,
  error_message
FROM resume_reviews
ORDER BY submitted_at DESC
LIMIT 5;
```

### Test 3: Check n8n Logs
- Look for incoming webhook requests
- Verify payload structure matches expected format

---

## Troubleshooting

### Issue: Webhook not being called

**Solution 1 (pg_net method)**:
- Check if pg_net is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_net';`
- Verify webhook URL is set: `SHOW app.n8n_webhook_url;`
- Check database logs for errors

**Solution 2 (Database Webhook method)**:
- Verify Edge Function is deployed: Check Supabase Dashboard → Edge Functions
- Check Edge Function logs for errors
- Verify Database Webhook is created and enabled
- Check webhook URL in Database Webhook settings

### Issue: Webhook called but n8n not receiving

**Solution**:
- Check n8n webhook node is active
- Verify webhook URL is correct
- Check n8n server logs
- Test webhook URL manually with curl:
  ```bash
  curl -X POST https://your-n8n-instance.com/webhook/resume-review \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```

### Issue: pg_net extension not available

**Solution**: Use Method 2 (Database Webhooks + Edge Function) instead

---

## Webhook Payload Structure

The webhook will receive this JSON payload:

```json
{
  "id": "uuid-of-resume-review",
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "target_role": "Software Engineer",
  "experience_years": 3,
  "resume_url": "https://...supabase.co/storage/v1/object/public/candidate-resumes/...",
  "status": "pending",
  "submitted_at": "2025-02-06T12:00:00Z",
  "utm_source": null,
  "referrer": "https://...",
  "timestamp": "2025-02-06T12:00:00Z"
}
```

---

## Next Steps

After webhook is working:
1. Set up n8n workflow to process the resume
2. Generate AI report
3. Store report in Supabase Storage
4. Send email with report and booking CTA
5. Update database status to 'completed'

See `N8N_INTEGRATION_GUIDE.md` for complete workflow setup.


