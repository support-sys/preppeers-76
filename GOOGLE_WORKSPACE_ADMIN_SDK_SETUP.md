# 🚀 Google Workspace Admin SDK Setup Guide

## 🎯 **Why Admin SDK is Better**

### **Advantages over Regular APIs:**
- ✅ **Meeting Recording** - Automatic recording of all interviews
- ✅ **Enhanced Security** - Domain-wide meeting policies
- ✅ **Better Control** - Admin-level access to all features
- ✅ **Compliance** - Meeting policies and audit trails
- ✅ **Reliability** - Higher API quotas and better uptime

## 🔑 **Setup Requirements**

### **1. Google Workspace Account**
- **Business/Enterprise** Google Workspace plan
- **Super Admin** access to your domain
- **Domain verification** completed

### **2. Google Cloud Project**
- **Google Cloud Console** project created
- **APIs enabled** for Admin SDK, Calendar, Meet
- **Billing enabled** (required for some APIs)

### **3. Service Account**
- **Service account** created with proper permissions
- **Domain-wide delegation** enabled
- **JSON key file** downloaded

## 🚀 **Step-by-Step Setup**

### **Step 1: Enable APIs in Google Cloud Console**

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/)
2. **Select your project** or create a new one
3. **Enable these APIs:**
   ```
   - Admin SDK API
   - Google Calendar API
   - Google Meet API
   - Google Drive API (for recording storage)
   ```

### **Step 2: Create Service Account**

1. **Go to** IAM & Admin → Service Accounts
2. **Click** "Create Service Account"
3. **Fill details:**
   - Name: `interview-platform-admin`
   - Description: `Service account for interview platform with Admin SDK access`
4. **Click** "Create and Continue"

### **Step 3: Grant Admin SDK Permissions**

1. **Click** "Grant Access" for the service account
2. **Add these roles:**
   ```
   - Admin SDK Directory API Administrator
   - Calendar API Admin
   - Meet API Admin
   - Drive API Admin
   ```
3. **Click** "Done"

### **Step 4: Enable Domain-Wide Delegation**

1. **Click on** your service account
2. **Go to** "Keys" tab
3. **Click** "Add Key" → "Create New Key"
4. **Choose** JSON format
5. **Download** the key file
6. **Note the** `client_email` from the JSON

### **Step 5: Configure Domain-Wide Delegation**

1. **Go to** [Google Workspace Admin Console](https://admin.google.com/)
2. **Navigate to** Security → API Controls → Domain-wide Delegation
3. **Click** "Add new"
4. **Fill details:**
   - Client ID: `[YOUR_SERVICE_ACCOUNT_CLIENT_ID]`
   - OAuth Scopes: 
   ```
   https://www.googleapis.com/auth/admin.directory.user,
   https://www.googleapis.com/auth/admin.directory.group,
   https://www.googleapis.com/auth/calendar,
   https://www.googleapis.com/auth/meet,
   https://www.googleapis.com/auth/drive
   ```

### **Step 6: Set Environment Variables**

Add these to your Supabase environment:

```bash
# Service account credentials (the entire JSON content)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Your Google Workspace admin email
GOOGLE_WORKSPACE_ADMIN_EMAIL=admin@yourdomain.com
```

## 🎥 **Meeting Recording Configuration**

### **Method 1: Domain-Wide Policies (Recommended)**

1. **Go to** Google Workspace Admin Console
2. **Navigate to** Apps → Google Workspace → Google Meet
3. **Click** "Meet video settings"
4. **Enable** "Record meetings"
5. **Set** "Who can record meetings" to "Only the meeting organizer"
6. **Enable** "Save recordings to Drive"

### **Method 2: Per-Meeting Configuration (via API)**

The Admin SDK allows you to set recording policies per meeting:

```typescript
recording: {
  enabled: true, // Enable recording for interviews
  allowParticipantsToRecord: false, // Only admins can record
  recordingMode: "RECORDING_MODE_ALWAYS" // Always record
}
```

## 🔒 **Security Features Enabled**

### **Enhanced Meeting Security:**
- ✅ **Authentication required** - Only Google accounts can join
- ✅ **No anonymous users** - All participants must be identified
- ✅ **No join before host** - Interviewer must be present
- ✅ **No additional invites** - Participants can't invite others
- ✅ **Domain restrictions** - Only your domain users can join

### **Recording Security:**
- ✅ **Admin-only recording** - Only authorized users can record
- ✅ **Secure storage** - Recordings saved to Google Drive
- ✅ **Access control** - Recording access managed by admins
- ✅ **Audit trails** - Track who accessed recordings

## 🧪 **Testing the Setup**

### **Test 1: API Access**
```bash
# Test Admin SDK access
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://admin.googleapis.com/admin/directory/v1/users"
```

### **Test 2: Meeting Creation**
1. **Schedule a test interview**
2. **Check logs** for successful Admin SDK access
3. **Verify** meeting room creation
4. **Test** recording functionality

### **Test 3: Recording Verification**
1. **Join the meeting** as interviewer
2. **Start recording** (if enabled)
3. **Check Google Drive** for recording files
4. **Verify** access permissions

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Insufficient permissions"**
**Solution:** Ensure service account has Admin SDK roles and domain-wide delegation is enabled.

### **Issue 2: "Domain not verified"**
**Solution:** Complete domain verification in Google Workspace Admin Console.

### **Issue 3: "API not enabled"**
**Solution:** Enable required APIs in Google Cloud Console.

### **Issue 4: "Recording not working"**
**Solution:** Check domain-wide recording policies in Admin Console.

## 📊 **Expected Results**

### **After Successful Setup:**
- ✅ **Real meeting rooms** created for every interview
- ✅ **Automatic recording** enabled (configurable)
- ✅ **Enhanced security** with domain policies
- ✅ **Better reliability** with Admin SDK access
- ✅ **Professional meeting experience** for users

### **Log Output:**
```
🎯 Creating Google Meet room via Admin SDK for: Mock Interview: Java Developer
🔑 Google credentials found, creating meeting via Admin SDK...
🔐 JWT created with Admin SDK scopes, requesting access token...
✅ Access token obtained, creating meeting via Admin SDK...
🎯 Attempting to create meeting via Google Meet API with Admin access...
🎉 Successfully created meeting via Meet API with Admin SDK: {meetingId: "abc-defg-hij", recording: true}
✅ Google Meet link created successfully: https://meet.google.com/abc-defg-hij
```

## 🎯 **Next Steps**

1. **Complete the setup** following this guide
2. **Test with a sample interview**
3. **Verify recording functionality**
4. **Monitor logs** for any issues
5. **Configure additional** domain policies as needed

## 🔗 **Useful Links**

- [Google Workspace Admin SDK Documentation](https://developers.google.com/admin-sdk)
- [Google Meet API Documentation](https://developers.google.com/meet)
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Domain-Wide Delegation Guide](https://developers.google.com/admin-sdk/directory/v1/guides/delegation)

The Admin SDK approach will give you enterprise-grade meeting capabilities with recording, security, and compliance features! 🚀
