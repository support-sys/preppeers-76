# Supabase Storage Setup - Fix RLS Policy Issues

## 🚨 Current Issue: "New row violates row level security policy"

This error occurs when the storage bucket doesn't exist or RLS policies aren't configured correctly.

## Step 1: Create the Storage Bucket

### Via Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Set the following:
   - **Name**: `candidate-resumes`
   - **Public bucket**: ✅ **CHECKED** (important for read access)
   - **File size limit**: 5MB (or your preferred limit)
5. Click **Create bucket**

### Via SQL (Alternative):
```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-resumes', 'candidate-resumes', true);
```

## Step 2: Configure RLS Policies

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to view their own resumes
CREATE POLICY "Users can view their own resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to update their own resumes
CREATE POLICY "Users can update their own resumes" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Allow public read access for resumes (for interviewers)
CREATE POLICY "Public read access for resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-resumes'
);
```

## Step 3: Verify the Setup

### Test via SQL:
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'candidate-resumes';

-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### Test via Dashboard:
1. Go to **Storage** → **candidate-resumes**
2. Try to upload a test file manually
3. Check if the file appears in the bucket

## Step 4: Alternative Simplified Policies

If the above policies are too complex, try these simplified ones:

```sql
-- Simplified: Allow all authenticated users to upload to the bucket
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'candidate-resumes' AND
  auth.role() = 'authenticated'
);

-- Simplified: Allow public read access
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-resumes'
);
```

## Step 5: Debug Common Issues

### Issue 1: "Bucket does not exist"
**Solution**: Create the bucket first via dashboard or SQL

### Issue 2: "Policy violation"
**Solution**: 
1. Check if user is authenticated
2. Verify bucket name matches exactly: `candidate-resumes`
3. Ensure policies are created correctly

### Issue 3: "Permission denied"
**Solution**:
1. Make sure bucket is set to **Public**
2. Check that RLS policies allow the operation
3. Verify user authentication status

## Step 6: Test the Upload

Use the `ResumeUploadTest` component to verify:

1. **Test Storage Bucket Access** - Should show "Storage bucket OK"
2. **Upload a test file** - Should upload successfully
3. **Test Download** - Should download the file

## Step 7: Check Browser Console

Look for these logs:
```
Testing storage bucket access...
Storage bucket accessible: [...]
Uploading resume: resumes/{user_id}/{timestamp}_filename.pdf
Resume uploaded successfully: https://...
```

## Troubleshooting Commands

### Check if user is authenticated:
```javascript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
```

### Check bucket access:
```javascript
// In browser console
const { data, error } = await supabase.storage
  .from('candidate-resumes')
  .list('', { limit: 1 });
console.log('Bucket test:', { data, error });
```

### Check user ID format:
```javascript
// In browser console
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user?.id);
console.log('User ID type:', typeof user?.id);
```

## Common Fixes

### Fix 1: Bucket Name Mismatch
Make sure the bucket name in your code matches exactly:
```javascript
// Should be exactly 'candidate-resumes'
.from('candidate-resumes')
```

### Fix 2: User Authentication
Ensure user is logged in before upload:
```javascript
if (!user) {
  throw new Error('User not authenticated');
}
```

### Fix 3: File Path Structure
The file path should follow this pattern:
```
resumes/{user_id}/{timestamp}_{filename}
```

### Fix 4: Public Bucket
Make sure the bucket is set to **Public** in the Supabase dashboard.

## Final Verification

After setting up, test with this sequence:

1. ✅ Create bucket `candidate-resumes` (Public)
2. ✅ Apply RLS policies
3. ✅ Test bucket access
4. ✅ Upload test file
5. ✅ Download test file
6. ✅ Test in actual booking flow

If you still get RLS errors after following these steps, please share:
- The exact error message
- Your Supabase project URL
- The browser console logs 