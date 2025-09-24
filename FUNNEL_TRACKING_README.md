# Booking Funnel Tracking System

This system tracks how far interviewees progress through the booking process before making payment, enabling conversion funnel analysis and optimization.

## 🎯 Purpose

Track user behavior to identify:
- **Drop-off points** in the booking funnel
- **Plan preferences** and popularity
- **Time slot preferences**
- **Interviewer matching success rates**
- **Conversion rates** at each step

## 📊 Funnel Steps Tracked

1. **Profile Complete** - User completes their interviewee profile
2. **Plan Selected** - User selects an interview plan (essential/professional/executive)
3. **Time Selected** - User selects a preferred time slot
4. **Interviewer Matched** - System finds a matching interviewer
5. **Payment Initiated** - User proceeds to payment page
6. **Completed** - User successfully completes payment and booking

## 🗄️ Database Schema

### New Columns Added to `interviewees` Table:

```sql
-- Booking progress tracking
selected_plan VARCHAR(50)              -- Plan selected: essential, professional, executive
selected_time_slot TEXT                -- Time slot selected by user
matched_interviewer_id UUID            -- ID of matched interviewer
matched_interviewer_name TEXT          -- Name of matched interviewer
booking_progress VARCHAR(30)           -- Current progress in funnel
form_data JSONB                        -- Complete form data for analysis
last_activity_at TIMESTAMP             -- Last activity timestamp
match_score DECIMAL(5,2)              -- Matching score with interviewer
payment_session_id UUID               -- Reference to payment session if created
```

### Constraints:
- `booking_progress` must be one of: profile_complete, plan_selected, time_selected, matched, payment_initiated, completed
- `selected_plan` must be one of: essential, professional, executive (or NULL)

### Indexes:
- `idx_interviewees_booking_progress` - For filtering by progress
- `idx_interviewees_last_activity` - For time-based analysis
- `idx_interviewees_selected_plan` - For plan distribution analysis

## 🔧 Implementation

### 1. Migration
Run the migration to add the new columns:
```bash
# Run in Supabase SQL Editor
supabase/migrations/20250103000002_add_booking_progress_tracking.sql
```

### 2. Tracking Functions
The system uses utility functions in `src/utils/bookingProgressTracker.ts`:

```typescript
// Track plan selection
await trackPlanSelection(userId, selectedPlan, formData);

// Track time slot selection  
await trackTimeSlotSelection(userId, timeSlot);

// Track interviewer matching
await trackInterviewerMatching(userId, interviewerId, interviewerName, matchScore);

// Track payment initiation
await trackPaymentInitiation(userId, paymentSessionId);
```

### 3. Integration Points

**Form Submission** (`useBookingFlow.ts`):
- Tracks plan and time slot selection when form is submitted

**Interviewer Matching** (`useBookingFlow.ts`):
- Tracks when interviewer is successfully matched

**Payment Initiation** (`CashfreePayment.tsx`):
- Tracks when user proceeds to payment page

## 📈 Analytics

### Funnel Analytics Component
Use `FunnelAnalytics.tsx` to view:
- **Conversion rates** at each step
- **Drop-off analysis** showing where users leave
- **Plan distribution** showing popularity
- **Average match scores**

### Analytics Functions
```typescript
// Get funnel analytics data
const { data, error } = await getFunnelAnalytics(dateRange);

// Get booking progress for specific user
const { data, error } = await getBookingProgress(userId);
```

## 🧪 Testing

### Test Suite
Run the test suite to verify implementation:
```typescript
import { testFunnelTracking } from '@/utils/testFunnelTracking';

// Run tests
const success = await testFunnelTracking();

// Clean up test data
await cleanupTestData();
```

### Test Coverage
- ✅ Table structure validation
- ✅ Data insertion testing
- ✅ Analytics query testing
- ✅ Constraint validation
- ✅ Index performance testing

## 📊 Sample Analytics Queries

### Conversion Rate Analysis
```sql
SELECT 
  booking_progress,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM interviewees), 2) as percentage
FROM interviewees 
GROUP BY booking_progress 
ORDER BY 
  CASE booking_progress
    WHEN 'profile_complete' THEN 1
    WHEN 'plan_selected' THEN 2
    WHEN 'time_selected' THEN 3
    WHEN 'matched' THEN 4
    WHEN 'payment_initiated' THEN 5
    WHEN 'completed' THEN 6
  END;
```

### Plan Distribution
```sql
SELECT 
  selected_plan,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM interviewees WHERE selected_plan IS NOT NULL), 2) as percentage
FROM interviewees 
WHERE selected_plan IS NOT NULL
GROUP BY selected_plan;
```

### Drop-off Analysis
```sql
WITH funnel_data AS (
  SELECT 
    COUNT(*) FILTER (WHERE booking_progress = 'profile_complete') as step1,
    COUNT(*) FILTER (WHERE booking_progress = 'plan_selected') as step2,
    COUNT(*) FILTER (WHERE booking_progress = 'time_selected') as step3,
    COUNT(*) FILTER (WHERE booking_progress = 'matched') as step4,
    COUNT(*) FILTER (WHERE booking_progress = 'payment_initiated') as step5,
    COUNT(*) FILTER (WHERE booking_progress = 'completed') as step6
  FROM interviewees
)
SELECT 
  'Profile → Plan' as step,
  step1 as from_count,
  step2 as to_count,
  step1 - step2 as dropoff,
  ROUND((step1 - step2) * 100.0 / step1, 2) as dropoff_rate
FROM funnel_data
UNION ALL
SELECT 'Plan → Time', step2, step3, step2 - step3, ROUND((step2 - step3) * 100.0 / step2, 2) FROM funnel_data
UNION ALL
SELECT 'Time → Matched', step3, step4, step3 - step4, ROUND((step3 - step4) * 100.0 / step3, 2) FROM funnel_data
UNION ALL
SELECT 'Matched → Payment', step4, step5, step4 - step5, ROUND((step4 - step5) * 100.0 / step4, 2) FROM funnel_data
UNION ALL
SELECT 'Payment → Completed', step5, step6, step5 - step6, ROUND((step5 - step6) * 100.0 / step5, 2) FROM funnel_data;
```

## 🚀 Usage

### In Development
1. Run the migration
2. Test the implementation with the test suite
3. Use the analytics component to view funnel data

### In Production
1. Deploy the migration
2. Monitor funnel analytics regularly
3. Use insights to optimize the booking flow

## 📝 Notes

- **Privacy**: Form data is stored as JSONB for analysis but should be handled according to privacy policies
- **Performance**: Indexes are optimized for common analytics queries
- **Data Retention**: Consider implementing data retention policies for old funnel data
- **Real-time**: The system tracks progress in real-time as users move through the funnel

## 🔍 Troubleshooting

### Common Issues:
1. **Missing columns**: Ensure migration was run successfully
2. **Constraint errors**: Check that enum values are used correctly
3. **Performance issues**: Verify indexes are created and being used
4. **Data not tracking**: Check that tracking functions are called at the right points in the flow

### Debug Commands:
```sql
-- Check if columns exist
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'interviewees' AND column_name LIKE '%selected%';

-- Check constraints
SELECT conname, contype FROM pg_constraint 
WHERE conrelid = 'interviewees'::regclass;

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'interviewees';
```
