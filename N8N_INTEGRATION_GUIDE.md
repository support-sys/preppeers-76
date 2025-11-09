# n8n Integration Guide for Resume Review

This guide explains how to set up n8n automation to process resume reviews, generate AI reports, and send emails.

## Overview

When a user submits a resume via `/resume-review`, the data is stored in the `resume_reviews` table with `status='pending'`. **A database trigger automatically calls your n8n webhook** when a new record is inserted, so no polling is needed!

## Storage Setup

### Create Reports Storage Bucket

The migration `20250206000001_create_reports_storage_bucket.sql` creates a storage bucket for reports. If you haven't run it, create the bucket manually:

1. Go to Supabase Dashboard > Storage
2. Create bucket: `resume-review-reports`
3. Set as **Public** bucket
4. File size limit: 10MB
5. Allowed types: PDF, HTML, TXT

Or run the migration SQL to set it up automatically.

## Database Schema

### `resume_reviews` Table

```sql
- id (UUID) - Primary key
- user_id (UUID) - User ID if logged in (nullable)
- user_email (TEXT) - Email address
- user_name (TEXT) - User's name
- target_role (TEXT) - Target job role
- experience_years (INTEGER) - Years of experience
- resume_url (TEXT) - URL to resume in Supabase Storage
- status (VARCHAR) - 'pending', 'processing', 'completed', 'failed'
- report_url (TEXT) - **Public URL to report file stored in Supabase Storage** (nullable)
- report_generated_at (TIMESTAMP) - When report was generated
- email_sent_at (TIMESTAMP) - When email was sent
- webhook_triggered_at (TIMESTAMP) - When marked for processing
- error_message (TEXT) - Error message if failed
- submitted_at (TIMESTAMP) - When resume was submitted
- converted_to_booking (BOOLEAN) - Conversion tracking
- booking_id (UUID) - Related interview ID (nullable)
- conversion_date (TIMESTAMP) - When converted (nullable)
- utm_source (TEXT) - UTM source tracking
- referrer (TEXT) - Referrer URL
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## n8n Workflow Setup

### Step 1: Create Webhook Node in n8n

1. Add **Webhook** node in n8n
2. Configure:
   - **HTTP Method**: POST
   - **Path**: `/resume-review` (or any path you prefer)
   - **Response Mode**: Respond to Webhook
3. **Copy the webhook URL** (e.g., `https://your-n8n-instance.com/webhook/resume-review`)

### Step 2: Configure Database Trigger

Choose **ONE** of the following options:

#### **Option A: Using pg_net Extension (Recommended - Direct HTTP Call)**

1. **Enable pg_net extension** in Supabase SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. **Set webhook URL** in Supabase SQL Editor:
   ```sql
   ALTER DATABASE postgres SET app.n8n_webhook_url = 'https://your-n8n-instance.com/webhook/resume-review';
   ```

3. **Test**: When a new resume is submitted, the trigger will automatically call your n8n webhook!

#### **Option B: Using Supabase Database Webhooks + Edge Function**

1. **Deploy Edge Function**:
   ```bash
   supabase functions deploy resume-review-webhook
   ```

2. **Set n8n webhook URL as secret**:
   ```bash
   supabase secrets set N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/resume-review
   ```

3. **Create Database Webhook** in Supabase Dashboard:
   - Go to **Database** > **Webhooks**
   - Click **"Create a new webhook"**
   - **Name**: "Resume Review to n8n"
   - **Table**: `resume_reviews`
   - **Events**: `INSERT`
   - **Type**: HTTP Request
   - **URL**: `https://{project-ref}.supabase.co/functions/v1/resume-review-webhook`
   - **HTTP Method**: POST
   - **HTTP Headers**: `{"Authorization": "Bearer {service_role_key}"}`

4. The Edge Function will forward the webhook to n8n automatically.

### Step 3: Receive Webhook in n8n

1. Your **Webhook** node will receive the payload automatically when a resume is submitted
2. The payload structure:
   ```json
   {
     "id": "uuid",
     "user_email": "user@example.com",
     "user_name": "John Doe",
     "target_role": "Software Engineer",
     "experience_years": 3,
     "resume_url": "https://...",
     "status": "pending",
     "submitted_at": "2025-02-06T...",
     "utm_source": null,
     "referrer": "https://...",
     "timestamp": "2025-02-06T..."
   }
   ```

### Step 4: Update Status to Processing

1. Add **Supabase** node (Update)
2. Configure connection (if not already done):
   - **Host**: Your Supabase project URL
   - **Service Role Key**: Get from Supabase Dashboard > Settings > API
3. Update status:
   ```sql
   UPDATE resume_reviews 
   SET status = 'processing', updated_at = NOW()
   WHERE id = '{{ $json.id }}'
   ```

### Step 5: Fetch Resume from Supabase Storage

1. Add **HTTP Request** node
2. Method: GET
3. URL: `{{ $json.resume_url }}`
4. This will download the resume file

### Step 6: Generate AI Report

1. Add **AI** node (OpenAI, Anthropic, or your preferred AI service)
2. Configure prompt:
   ```
   Analyze this resume for a {{ $json.target_role }} position.
   The candidate has {{ $json.experience_years }} years of experience.
   
   Provide:
   1. Overall assessment (strengths, weaknesses)
   2. Key skills analysis
   3. Areas for improvement
   4. Suggestions for optimization
   5. ATS compatibility score
   6. Recommendations for the target role
   
   Format the response as a professional, detailed report.
   ```

3. Pass the resume content (text extracted from PDF/DOC) to the AI

### Step 7: Store Report in Supabase Storage

**✅ RECOMMENDED: Store in Supabase Storage**

1. Add **Supabase** node (Upload File) or use **HTTP Request** to Supabase Storage API
2. Upload the generated report (as PDF or HTML) to the `resume-review-reports` bucket
3. File path structure: `reports/{{ $json.id }}/report_{{ $json.id }}.pdf`
4. Get the public URL using Supabase Storage API:
   ```
   https://{project-ref}.supabase.co/storage/v1/object/public/resume-review-reports/reports/{review_id}/report_{review_id}.pdf
   ```

**Alternative: Store Externally**
- If you prefer external storage (S3, Google Drive, etc.), store there and save the URL
- The `report_url` column accepts any valid URL

### Step 8: Update Database

1. Add **Supabase** node (Update)
2. Update the record:
   ```sql
   UPDATE resume_reviews 
   SET 
     status = 'completed',
     report_url = '{{ $json.report_url }}',
     report_generated_at = NOW(),
     updated_at = NOW()
   WHERE id = '{{ $json.id }}'
   ```

### Step 9: Send Email

1. Add **Email** node (Gmail, SendGrid, etc.)
2. Configure:
   - **To**: `{{ $json.user_email }}`
   - **Subject**: "Your Resume Review Report is Ready - {{ $json.user_name }}"
   - **Body**: HTML email with:
     - Personalized greeting
     - Link to download report: `{{ $json.report_url }}`
     - Summary of findings
     - **Call-to-action to book a mock interview** (see template below)

**Email Template (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .benefits { background: #e0f2fe; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .benefit-item { margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Resume Review is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi {{ $json.user_name }},</p>
      
      <p>Great news! We've completed your AI-powered resume review for your <strong>{{ $json.target_role }}</strong> position.</p>
      
      <p><strong>📥 Download Your Report:</strong></p>
      <p><a href="{{ $json.report_url }}" class="cta-button">Download Resume Review Report</a></p>
      
      <div class="benefits">
        <h3>📊 What's in Your Report:</h3>
        <div class="benefit-item">✅ Overall assessment & strengths</div>
        <div class="benefit-item">✅ Areas for improvement</div>
        <div class="benefit-item">✅ ATS compatibility score</div>
        <div class="benefit-item">✅ Targeted recommendations</div>
        <div class="benefit-item">✅ Actionable next steps</div>
      </div>
      
      <h3>🎯 Ready to Ace Your Interview?</h3>
      <p>You've improved your resume. Now, practice with a <strong>real mock interview</strong> and get expert feedback to boost your confidence!</p>
      
      <div class="benefits">
        <h3>Why Book a Mock Interview?</h3>
        <div class="benefit-item">✅ Practice real interview questions</div>
        <div class="benefit-item">✅ Get expert feedback from industry professionals</div>
        <div class="benefit-item">✅ Build confidence before the real interview</div>
        <div class="benefit-item">✅ Learn from personalized tips and suggestions</div>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="https://your-domain.com/book?source=resume-review&email={{ encodeURIComponent($json.user_email) }}" class="cta-button">
          Book Your Mock Interview Now 🚀
        </a>
      </p>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        <strong>Special Offer:</strong> Resume review users get priority matching! Book now and get matched faster.
      </p>
      
      <p>Best of luck with your job search!</p>
      <p>The InterviewWise Team</p>
    </div>
  </div>
</body>
</html>
```

**Important:** Replace `https://your-domain.com` with your actual domain in the booking link.

3. After sending, update `email_sent_at`:
   ```sql
   UPDATE resume_reviews 
   SET email_sent_at = NOW()
   WHERE id = '{{ $json.id }}'
   ```

### Step 10: Error Handling

1. Add **Error Trigger** node
2. On error, update status to 'failed':
   ```sql
   UPDATE resume_reviews 
   SET 
     status = 'failed',
     error_message = '{{ $json.error.message }}',
     updated_at = NOW()
   WHERE id = '{{ $json.id }}'
   ```

## How It Works

### Trigger Flow:
```
1. User submits resume → INSERT into resume_reviews table
   ↓
2. Database trigger fires → trigger_resume_review_webhook()
   ↓
3. Trigger calls n8n webhook (via pg_net OR Database Webhook → Edge Function)
   ↓
4. n8n receives webhook → Processes resume → Generates report → Sends email
   ↓
5. n8n updates database → Status changes to 'completed'
```

### Benefits:
- ✅ **Real-time**: No polling delay (instant processing)
- ✅ **Efficient**: Only processes new submissions
- ✅ **Reliable**: Database trigger ensures webhook is called
- ✅ **Scalable**: Handles multiple submissions simultaneously

## Database Function

The migration includes a helper function you can call from n8n:

```sql
SELECT update_resume_review_status(
  'review_id'::UUID,
  'completed'::VARCHAR,
  'https://report-url.com/report.pdf'::TEXT,
  NULL::TEXT  -- error_message (NULL if success)
);
```

## Testing

1. Submit a test resume via `/resume-review`
2. Check `resume_reviews` table - should have `status='pending'`
3. Wait for n8n to pick it up (or trigger manually)
4. Verify status changes to 'processing', then 'completed'
5. Check email was sent
6. Verify report URL is stored

## Monitoring

Query to check processing status:
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (report_generated_at - submitted_at))/60) as avg_minutes
FROM resume_reviews
WHERE submitted_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```

## Report Storage Details

### How Reports are Stored

1. **Report File**: Stored in Supabase Storage bucket `resume-review-reports`
   - Path: `reports/{review_id}/report_{review_id}.pdf`
   - Format: PDF (recommended) or HTML
   - Public URL: `https://{project-ref}.supabase.co/storage/v1/object/public/resume-review-reports/reports/{review_id}/report_{review_id}.pdf`

2. **Report URL**: Stored in database column `resume_reviews.report_url`
   - This is the public URL to access the report
   - Used in emails and for direct access

3. **Access**: Reports are publicly accessible via the URL (bucket is public)
   - Candidates can access their reports via the email link
   - No authentication required (public bucket)

### Example n8n Flow for Uploading Report

1. **Generate Report** (AI node) → Get report content/text
2. **Convert to PDF** (if needed) → Use PDF generation library
3. **Upload to Supabase Storage**:
   ```javascript
   // In n8n Code node or HTTP Request
   const fileName = `reports/${reviewId}/report_${reviewId}.pdf`;
   const uploadUrl = `https://${projectRef}.supabase.co/storage/v1/object/resume-review-reports/${fileName}`;
   
   // Upload using service role key
   fetch(uploadUrl, {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${serviceRoleKey}`,
       'Content-Type': 'application/pdf'
     },
     body: reportPdfBuffer
   });
   ```
4. **Get Public URL**:
   ```javascript
   const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/resume-review-reports/${fileName}`;
   ```
5. **Update Database** with `publicUrl`

## Notes

- **Rate Limiting**: Add delays between processing to avoid overwhelming AI API
- **Retry Logic**: Implement retry for failed AI calls
- **Queue Management**: Process oldest submissions first
- **Storage**: 
  - Resume bucket: `candidate-resumes` (for uploaded resumes)
  - Report bucket: `resume-review-reports` (for generated reports)
- **Security**: Use service role key only in n8n (never expose to frontend)
- **Report Format**: PDF recommended for professional appearance and easy sharing

