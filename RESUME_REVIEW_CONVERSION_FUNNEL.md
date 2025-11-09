# Resume Review to Mock Interview Conversion Funnel

## Overview

This document outlines the complete conversion funnel from resume review to mock interview booking, designed to maximize conversions and track user journey.

## Funnel Stages

### Stage 1: Resume Review Submission
- **Entry Point**: `/resume-review`
- **Action**: User submits resume for AI review
- **Data Captured**:
  - Email, Name, Target Role, Experience
  - Resume file (stored in Supabase Storage)
  - UTM source, referrer
- **Status**: `pending` → `processing` → `completed`

### Stage 2: Success Page (Immediate CTA)
- **Location**: `/resume-review` (after submission)
- **Features**:
  - ✅ Success confirmation message
  - 🎯 **Prominent CTA**: "Book Your Mock Interview Now"
  - Benefits highlighted (real-time practice, expert feedback, confidence boost)
  - Special offer: "Priority matching for resume review users"
- **Conversion Link**: `/book?source=resume-review&email={email}`

### Stage 3: Email Delivery (24 hours later)
- **Trigger**: n8n workflow after AI report generation
- **Content**:
  - Download link for resume review report
  - Summary of findings
  - **Strong CTA**: "Book Your Mock Interview Now"
  - Benefits and value proposition
  - Special offer reminder
- **Tracking**: Email link includes `source=resume-review&email={email}`

### Stage 4: Booking Page (Personalized Experience)
- **Location**: `/book?source=resume-review&email={email}`
- **Features**:
  - **Resume Review CTA Banner**: Shows if user came from resume review
  - Pre-filled form data (if available from resume review)
  - Personalized messaging: "You've reviewed your resume. Now ace the interview!"
  - Benefits reminder
- **Conversion**: User books mock interview

### Stage 5: Conversion Tracking
- **Trigger**: When interview is successfully scheduled
- **Action**: Update `resume_reviews` table:
  - `converted_to_booking = true`
  - `booking_id = {interview_id}`
  - `conversion_date = NOW()`
- **Analytics**: Track conversion rate

## Implementation Details

### 1. Success Page CTA
**File**: `src/pages/ResumeReview.tsx`
- Prominent green CTA button
- Benefits grid (3 columns)
- Special offer messaging
- Direct link to booking with tracking params

### 2. Email Template
**Location**: n8n workflow
- HTML email with professional design
- Download report button
- Mock interview CTA button
- Benefits section
- Tracking parameters in booking link

### 3. Booking Page Integration
**File**: `src/pages/Book.tsx`
- Detects `source=resume-review` URL parameter
- Shows `ResumeReviewCTA` component
- Fetches resume review data
- Pre-fills form if data available

### 4. Conversion Tracking
**File**: `src/utils/resumeReviewConversion.ts`
- `trackResumeReviewConversion()`: Updates database when interview booked
- `getResumeReviewData()`: Fetches resume review data
- `getResumeReviewConversionStats()`: Analytics

**Integration**: `src/services/interviewScheduling.ts`
- Automatically tracks conversion after interview scheduled

## Conversion Metrics

### Key Metrics to Track:
1. **Resume Review Submissions**: Total number of resume reviews
2. **Email Opens**: How many users opened the email
3. **Email Clicks**: Clicks on booking CTA in email
4. **Success Page CTA Clicks**: Clicks on booking button from success page
5. **Bookings from Resume Review**: Total conversions
6. **Conversion Rate**: (Bookings / Submissions) × 100

### Database Queries:

```sql
-- Total submissions
SELECT COUNT(*) FROM resume_reviews;

-- Conversion rate
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN converted_to_booking THEN 1 END) as converted,
  ROUND(COUNT(CASE WHEN converted_to_booking THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as conversion_rate
FROM resume_reviews;

-- Conversion by source
SELECT 
  utm_source,
  COUNT(*) as total,
  COUNT(CASE WHEN converted_to_booking THEN 1 END) as converted
FROM resume_reviews
GROUP BY utm_source;

-- Time to conversion
SELECT 
  AVG(EXTRACT(EPOCH FROM (conversion_date - submitted_at))/3600) as avg_hours_to_conversion
FROM resume_reviews
WHERE converted_to_booking = true;
```

## Optimization Strategies

### 1. A/B Testing
- Test different CTA button colors/text
- Test email subject lines
- Test success page messaging

### 2. Retargeting
- Follow-up emails for non-converters (3 days, 7 days)
- Special discounts for resume review users
- Reminder emails about benefits

### 3. Personalization
- Use target role in messaging
- Reference specific resume findings
- Show relevant success stories

### 4. Incentives
- Priority matching (already implemented)
- Discount codes for resume review users
- Free add-ons (resume review, recording)

## Future Enhancements

1. **Exit Intent Popup**: Show CTA when user tries to leave success page
2. **Social Proof**: Show "X users booked after resume review"
3. **Countdown Timer**: "Limited time offer" messaging
4. **Video Testimonial**: Short video on success page
5. **Comparison Table**: Resume review vs. Mock interview benefits
6. **Progress Indicator**: Show user's journey progress

## Files Modified/Created

### Created:
- `src/utils/resumeReviewConversion.ts` - Conversion tracking utilities
- `src/components/ResumeReviewCTA.tsx` - CTA component for booking page
- `RESUME_REVIEW_CONVERSION_FUNNEL.md` - This document

### Modified:
- `src/pages/ResumeReview.tsx` - Added success page CTA
- `src/pages/Book.tsx` - Added resume review detection and CTA
- `src/services/interviewScheduling.ts` - Added conversion tracking
- `N8N_INTEGRATION_GUIDE.md` - Added email template

## Testing Checklist

- [ ] Submit resume review
- [ ] Verify success page shows CTA
- [ ] Click CTA and verify booking page shows resume review banner
- [ ] Complete booking and verify conversion tracked in database
- [ ] Check email template renders correctly
- [ ] Verify email booking link works
- [ ] Test conversion tracking query
- [ ] Verify analytics view shows correct data


