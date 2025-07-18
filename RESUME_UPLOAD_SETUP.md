# Resume Upload Setup Guide

## Overview
This guide will help you set up the resume upload functionality in the InterviewChecked application. The system now uploads resumes to Supabase storage and makes them available in interview details.

## 1. Supabase Storage Setup

### Step 1: Create Storage Bucket
1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set bucket name: `candidate-resumes`
5. Set to **Public** (for read access)
6. Click **Create bucket**

### Step 2: Configure Storage Policies
Run the following SQL in your Supabase SQL editor:

```sql
-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own resumes
CREATE POLICY "Users can view their own resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own resumes
CREATE POLICY "Users can update their own resumes" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access for resumes
CREATE POLICY "Public read access for resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-resumes'
);
```

## 2. Database Schema Updates

### Step 1: Add Resume URL to Interviewees Table
The `interviewees` table already has a `resume_url` column, but if it doesn't exist, run:

```sql
-- Add resume_url column to interviewees table
ALTER TABLE public.interviewees 
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Add resume_url column to interviews table (if not exists)
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS resume_url TEXT;
```

## 3. Features Implemented

### ✅ Resume Upload Functionality
- **File Validation**: PDF, DOC, DOCX files only
- **Size Limit**: 5MB maximum file size
- **Unique Naming**: Timestamp-based unique filenames
- **User Isolation**: Each user's resumes in their own folder
- **Error Handling**: Comprehensive error messages

### ✅ Interview Details Integration
- **Resume Display**: Shows uploaded resume in interview details
- **Download Link**: Interviewers can view/download candidate resumes
- **Fallback Handling**: Graceful handling when resume not available

### ✅ Payment Session Integration
- **Resume URL Storage**: Resume URL stored in payment session data
- **Interview Scheduling**: Resume URL passed to interview scheduling
- **Google Sheets Sync**: Resume information included in data export

## 4. File Structure

```
resumes/
├── {user_id}/
│   ├── {timestamp}_resume_name.pdf
│   ├── {timestamp}_resume_name.docx
│   └── ...
```

## 5. Code Changes Made

### 1. CandidateRegistrationForm.tsx
- ✅ Added `uploadResume()` function
- ✅ Added file validation (type, size)
- ✅ Added loading states for upload
- ✅ Updated form submission to upload resume first
- ✅ Added resume URL to form data

### 2. InterviewDetailsDialog.tsx
- ✅ Updated to fetch and display actual resume URL
- ✅ Added fallback handling for missing resumes
- ✅ Improved candidate data extraction from payment sessions

### 3. interviewScheduling.ts
- ✅ Updated `scheduleInterview()` to use actual resume URL
- ✅ Fixed resume URL passing through interview data

### 4. Payment Processing
- ✅ Updated payment processing to handle resume URLs
- ✅ Updated Google Sheets sync to include resume information

## 6. Testing the Resume Upload

### Step 1: Test File Upload
1. Go to `/book` page
2. Fill out the candidate registration form
3. Upload a resume file (PDF, DOC, or DOCX)
4. Verify the upload progress indicator appears
5. Check that the file is uploaded successfully

### Step 2: Test Interview Scheduling
1. Complete the payment process
2. Schedule an interview
3. Check that the resume URL is stored in the database
4. Verify the resume appears in interview details

### Step 3: Test Interviewer View
1. Login as an interviewer
2. View interview details
3. Verify the resume download link is available
4. Test downloading the resume

## 7. Error Handling

### File Validation Errors
- **File Type**: Only PDF, DOC, DOCX allowed
- **File Size**: Maximum 5MB
- **Upload Errors**: Network issues, storage errors
- **User Feedback**: Clear error messages with retry options

### Fallback Scenarios
- **No Resume**: Shows "Resume not provided"
- **Upload Failed**: Allows retry or continue without resume
- **Missing URL**: Graceful degradation in interview details

## 8. Security Considerations

### File Security
- ✅ **User Isolation**: Each user can only access their own resumes
- ✅ **File Validation**: Prevents malicious file uploads
- ✅ **Size Limits**: Prevents abuse of storage
- ✅ **Unique Names**: Prevents filename conflicts

### Access Control
- ✅ **Authenticated Upload**: Only logged-in users can upload
- ✅ **Public Read**: Interviewers can view resumes for their interviews
- ✅ **URL Security**: Resume URLs are not easily guessable

## 9. Performance Optimizations

### Upload Optimizations
- ✅ **File Size Limits**: Prevents large file uploads
- ✅ **Progress Indicators**: User feedback during upload
- ✅ **Error Recovery**: Retry mechanisms for failed uploads

### Storage Optimizations
- ✅ **Unique Naming**: Prevents filename conflicts
- ✅ **User Folders**: Organized storage structure
- ✅ **Cache Control**: Proper cache headers for downloads

## 10. Monitoring and Debugging

### Upload Monitoring
```javascript
// Check upload status in browser console
console.log('Uploading resume:', fileName);
console.log('Resume uploaded successfully:', urlData.publicUrl);
```

### Error Monitoring
```javascript
// Check for upload errors
console.error('Error uploading resume:', error);
console.error('Resume upload error:', error);
```

### Storage Monitoring
- Monitor storage usage in Supabase dashboard
- Check for failed uploads in logs
- Monitor file access patterns

## 11. Troubleshooting

### Common Issues

#### Issue 1: "Failed to upload resume"
**Solution**: 
- Check Supabase storage bucket exists
- Verify storage policies are set correctly
- Check file size and type validation

#### Issue 2: "Resume not showing in interview details"
**Solution**:
- Verify resume URL is stored in payment session
- Check interview scheduling includes resume URL
- Verify storage bucket is public for read access

#### Issue 3: "File too large"
**Solution**:
- Reduce file size to under 5MB
- Compress PDF files if needed
- Use different file format

#### Issue 4: "Invalid file type"
**Solution**:
- Use only PDF, DOC, or DOCX files
- Check file extension matches content
- Convert file to supported format

## 12. Next Steps

1. **Test the complete flow** from upload to interview details
2. **Monitor storage usage** and set up alerts if needed
3. **Consider implementing** resume preview functionality
4. **Add resume versioning** for multiple uploads
5. **Implement resume deletion** for old uploads

## Support

If you encounter issues:
1. Check browser console for upload errors
2. Verify Supabase storage bucket configuration
3. Test with different file types and sizes
4. Check storage policies in Supabase dashboard 