# 🧪 Testing the Schedule-Interview Edge Function

## **Current Status**
- ✅ **Temporary blocking system**: WORKING PERFECTLY
- ❌ **Edge function**: 500 Internal Server Error

## **Step 1: Check Edge Function Logs**

1. **Go to Supabase Dashboard**
2. **Navigate to Edge Functions** → **schedule-interview**
3. **Click on the function** to see details
4. **Check the "Logs" tab** for recent errors

## **Step 2: Test Edge Function Directly**

### **Option A: Test from Supabase Dashboard**
1. **Go to Edge Functions** → **schedule-interview**
2. **Click "Test" button**
3. **Use this test payload:**
```json
{
  "interviewer_id": "5d86581b-40f0-4b2d-8dc6-bfb5baec1e28",
  "interviewer_user_id": "61603f0a-e251-4834-b7b7-cdc0b4be6d1e",
  "candidate_id": "test@example.com",
  "candidate_name": "Test User",
  "candidate_email": "test@example.com",
  "target_role": "Software Engineer",
  "specific_skills": ["JavaScript", "React"],
  "experience": "2",
  "scheduled_time": "2025-09-02T12:00:00.000Z",
  "status": "scheduled",
  "resume_url": null,
  "selected_plan": "essential",
  "interview_duration": 30,
  "plan_details": "essential"
}
```

### **Option B: Check Function Code**
1. **Go to your local project**
2. **Check `supabase/functions/schedule-interview/index.ts`**
3. **Look for any obvious errors**

## **Step 3: Common Issues & Solutions**

### **Issue 1: Missing Environment Variables**
**Symptoms**: 500 error, function can't connect to database
**Solution**: Check if these are set in Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_SERVICE_ACCOUNT_KEY` (if using GMeet)

### **Issue 2: Database Connection**
**Symptoms**: 500 error, database queries failing
**Solution**: Verify the edge function can connect to the database

### **Issue 3: Invalid Data Processing**
**Symptoms**: 500 error, data validation failing
**Solution**: Check the data format being sent

## **Step 4: Quick Test from Browser Console**

Open browser console and test:
```javascript
// Test the edge function directly
const { data, error } = await supabase.functions.invoke('schedule-interview', {
  body: {
    interviewer_id: '5d86581b-40f0-4b2d-8dc6-bfb5baec1e28',
    interviewer_user_id: '61603f0a-e251-4834-b7b7-cdc0b4be6d1e',
    candidate_id: 'test@example.com',
    candidate_name: 'Test User',
    candidate_email: 'test@example.com',
    target_role: 'Software Engineer',
    specific_skills: ['JavaScript', 'React'],
    experience: '2',
    scheduled_time: '2025-09-02T12:00:00.000Z',
    status: 'scheduled',
    resume_url: null,
    selected_plan: 'essential',
    interview_duration: 30,
    plan_details: 'essential'
  }
});

console.log('Response:', { data, error });
```

## **Expected Results**

- **If working**: Should see successful response or specific error message
- **If broken**: Will see 500 error with more details in logs

## **Next Steps**

1. **Check edge function logs** for specific error details
2. **Test the function directly** with the test payload
3. **Share the specific error message** from the logs
4. **I'll help fix the edge function issue**

---

## **🎯 Current Success**

The **temporary blocking system is working perfectly**:
- ✅ Time slots are secured during payment
- ✅ No more race conditions
- ✅ Automatic cleanup on failures
- ✅ Professional booking experience

We just need to fix the edge function to complete the flow! 🚀
