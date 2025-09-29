# Edge Functions Flow Explanation

## 🔍 What Does `find-matching-interviewer` Do?

### Purpose:
The `find-matching-interviewer` function is responsible for **finding the best available interviewer** for a candidate based on their profile and requirements.

### Input Parameters:
```typescript
{
  experienceYears: number,        // Candidate's years of experience
  skillCategories: string[],      // e.g., ["Frontend", "React", "JavaScript"]
  specificSkills: string[],       // e.g., ["React", "Node.js", "MongoDB"]
  timeSlot: string,               // e.g., "Monday, 06/10/2025 09:00-09:30"
  experience: string,             // Experience as string
  resume?: any,                   // Resume data (optional)
  currentPosition?: string,       // Current job title
  company?: string               // Current company
}
```

### What It Does:

1. **📊 Fetches All Available Interviewers**
   - Gets all interviewers from the database
   - Filters out unavailable ones
   - Excludes previous interviewers if specified

2. **🎯 Smart Matching Algorithm**
   - **Experience Matching**: Finds interviewers with similar or higher experience
   - **Skill Matching**: Matches specific technologies and skills
   - **Availability Check**: Ensures interviewer is available at the requested time
   - **Quality Scoring**: Ranks interviewers based on multiple factors

3. **📈 Scoring System**
   - **Skill Match Score**: How well skills align
   - **Experience Match Score**: Experience level compatibility
   - **Availability Score**: Time slot availability
   - **Overall Match Score**: Combined score (0-100)

4. **🏆 Returns Best Match**
   - Returns the highest-scoring available interviewer
   - Includes match details and confidence score
   - Returns `null` if no suitable interviewer found

### Output:
```typescript
{
  id: string,                    // Interviewer ID
  interviewer_name: string,      // Interviewer's name
  interviewer_email: string,     // Interviewer's email
  company: string,               // Interviewer's company
  match_score: number,           // Match score (0-100)
  available_slots: string[],     // Available time slots
  skills: string[],              // Interviewer's skills
  experience_years: number       // Years of experience
}
```

---

## 🔄 What Happens When `auto-book-interview` Calls?

### Purpose:
The `auto-book-interview` function **automatically books an interview** after a successful payment by finding an interviewer and scheduling the interview.

### Flow:

#### 1. **📋 Input Validation**
```typescript
{
  payment_session_id: string,    // ID of the completed payment
  user_id: string               // User who made the payment
}
```

#### 2. **💳 Payment Verification**
- Fetches the payment session from database
- Verifies payment status is 'completed'
- Checks if interview is already booked (prevents duplicates)
- Extracts candidate data from payment session

#### 3. **🔍 Find Matching Interviewer**
Calls `find-matching-interviewer` with candidate data:
```typescript
const matchingResponse = await supabaseClient.functions.invoke('find-matching-interviewer', {
  body: {
    experienceYears: candidateData.experienceYears,
    skillCategories: candidateData.skillCategories,
    specificSkills: candidateData.specificSkills,
    timeSlot: candidateData.selectedTimeSlot || candidateData.timeSlot,
    experience: candidateData.experienceYears?.toString(),
    resume: candidateData.resume,
    currentPosition: candidateData.currentPosition,
    company: candidateData.company
  },
  headers: { /* authentication headers */ }
});
```

#### 4. **📅 Schedule Interview**
If interviewer found, calls `schedule-interview`:
```typescript
const scheduleResponse = await supabaseClient.functions.invoke('schedule-interview', {
  body: {
    interviewer_id: matchedInterviewer.id,
    candidate_id: userProfile.email,
    candidate_name: userProfile.full_name,
    candidate_email: userProfile.email,
    interviewer_email: matchedInterviewer.interviewer_email,
    interviewer_name: matchedInterviewer.interviewer_name,
    target_role: candidateData.skillCategories?.join(', '),
    experience: candidateData.experienceYears?.toString(),
    scheduled_time: scheduledTimeISO,
    status: 'scheduled',
    resume_url: candidateData.resumeUrl,
    selected_plan: candidateData.selectedPlan,
    interview_duration: candidateData.interviewDuration,
    selected_add_ons: selected_add_ons,
    add_ons_total: add_ons_total
  },
  headers: { /* authentication headers */ }
});
```

#### 5. **📧 Send Notifications**
- Updates payment session with interview details
- Marks interview as matched
- Sends emails to both candidate and interviewer
- Creates Google Calendar events

#### 6. **✅ Success Response**
Returns confirmation with:
- Interview details
- Scheduled time
- Interviewer information
- Next steps

---

## 🔄 Complete Flow Diagram

```
Payment Completed
       ↓
payment-webhook (processes payment)
       ↓
auto-book-interview (triggered)
       ↓
find-matching-interviewer (finds best interviewer)
       ↓
schedule-interview (books the interview)
       ↓
send-interview-emails (notifies both parties)
       ↓
Google Calendar (creates calendar event)
       ↓
✅ Interview Scheduled Successfully
```

---

## 🎯 Key Benefits

### For Candidates:
- **Automatic Matching**: No manual selection needed
- **Smart Algorithm**: Best interviewer based on skills/experience
- **Instant Booking**: Interview scheduled immediately after payment
- **Email Notifications**: Confirmation and details sent automatically

### For Interviewers:
- **Quality Matches**: Only matched with relevant candidates
- **Calendar Integration**: Automatic calendar event creation
- **Email Notifications**: Immediate notification of new bookings

### For Business:
- **Automation**: Reduces manual intervention
- **Quality Control**: Algorithm ensures good matches
- **Scalability**: Can handle multiple bookings simultaneously
- **User Experience**: Seamless end-to-end flow

---

## 🔧 Technical Details

### Authentication:
- All function calls use service role key for authentication
- Headers include `Authorization: Bearer {service_key}` and `apikey: {service_key}`

### Error Handling:
- Comprehensive error checking at each step
- Graceful fallbacks when no interviewer found
- Detailed logging for debugging

### Data Flow:
- Payment data → Candidate profile → Interviewer matching → Interview scheduling → Notifications
