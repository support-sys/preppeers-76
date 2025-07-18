# Payment Processing Setup Guide

## Overview
This guide will help you fix the payment processing issues in the InterviewChecked application. The main problems are missing environment variables and configuration.

## 1. Cashfree Account Setup

### Step 1: Create Cashfree Merchant Account
1. Go to [Cashfree Merchant Portal](https://merchant.cashfree.com/)
2. Sign up for a merchant account
3. Complete KYC verification
4. Get your API credentials

### Step 2: Get API Credentials
1. Login to your Cashfree merchant dashboard
2. Go to **Settings > API Keys**
3. Copy your **App ID** and **Secret Key**
4. Note: Use **Test Mode** credentials for development

## 2. Environment Variables Setup

### For Local Development
Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jhhoeodofsbgfxndhotq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaG9lb2RvZnNiZ2Z4bmRob3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTAwNjQsImV4cCI6MjA2NjY4NjA2NH0.FgJT65W6Vk0jF4sdY0DLbUiAhvR1t3hm-gx57rZc88I

# Cashfree Payment Configuration
CASHFREE_APP_ID=your_cashfree_app_id_here
CASHFREE_SECRET_KEY=your_cashfree_secret_key_here
```

### For Supabase Edge Functions
1. Go to your Supabase dashboard
2. Navigate to **Settings > API > Edge Functions**
3. Add these environment variables:
   - `CASHFREE_APP_ID`: Your Cashfree App ID
   - `CASHFREE_SECRET_KEY`: Your Cashfree Secret Key

## 3. Cashfree SDK Configuration

### Step 1: Verify SDK Loading
The application already includes the Cashfree SDK in `index.html`:

```html
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
```

### Step 2: Test Mode vs Production Mode
In `src/components/CashfreePayment.tsx`, line 156:
```typescript
const cashfree = new (window as any).Cashfree({
  mode: "sandbox" // Change to "production" for live environment
});
```

## 4. Webhook Configuration

### Step 1: Set Webhook URL in Cashfree Dashboard
1. Go to your Cashfree merchant dashboard
2. Navigate to **Settings > Webhooks**
3. Add webhook URL: `https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook`
4. Select events: `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`

### Step 2: Test Webhook
The webhook function is already configured to handle test calls from Cashfree.

## 5. Testing the Payment Flow

### Step 1: Test Mode Setup
1. Use Cashfree test credentials
2. Use test card numbers:
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`

### Step 2: Test Payment Flow
1. Start the development server: `npm run dev`
2. Navigate to `/book` page
3. Fill out the candidate registration form
4. Click "Pay Now"
5. Use test card details
6. Verify payment success/failure

## 6. Common Issues and Solutions

### Issue 1: "Payment service is not available"
**Solution**: 
- Check if Cashfree SDK is loading properly
- Verify internet connection
- Check browser console for errors

### Issue 2: "Failed to create payment session"
**Solution**:
- Verify Cashfree credentials are correct
- Check Supabase edge function logs
- Ensure environment variables are set

### Issue 3: Payment not updating in database
**Solution**:
- Check webhook configuration
- Verify webhook URL is accessible
- Check Supabase function logs

### Issue 4: SDK not loading
**Solution**:
- Check if script is blocked by ad blockers
- Verify HTTPS connection
- Try refreshing the page

## 7. Production Deployment

### Step 1: Update Environment Variables
1. Change `mode` from "sandbox" to "production" in `CashfreePayment.tsx`
2. Use production Cashfree credentials
3. Update webhook URL to production domain

### Step 2: Security Considerations
1. Never commit `.env` files to version control
2. Use environment variables in production
3. Enable HTTPS for all payment pages
4. Implement proper error logging

## 8. Monitoring and Debugging

### Step 1: Enable Logging
The application includes comprehensive logging:
- Browser console for client-side errors
- Supabase function logs for server-side errors
- Payment status polling for real-time updates

### Step 2: Debug Payment Issues
1. Check browser console for JavaScript errors
2. Monitor Supabase function logs
3. Verify payment session creation in database
4. Test webhook endpoint manually

## 9. Additional Improvements Made

### Enhanced Error Handling
- Better error messages for users
- Retry mechanisms for failed payments
- SDK loading status indicators
- Graceful fallbacks for network issues

### Improved User Experience
- Loading states for all payment operations
- Clear status indicators
- Retry buttons for failed payments
- Better error messages

### Security Enhancements
- Proper input validation
- Secure payment session handling
- Environment variable protection
- Webhook signature verification (recommended)

## 10. Next Steps

1. **Set up Cashfree account** and get API credentials
2. **Configure environment variables** as described above
3. **Test the payment flow** in sandbox mode
4. **Deploy to production** with proper credentials
5. **Monitor payment success rates** and user feedback

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Test with Cashfree's test credentials first
4. Contact Cashfree support for API-related issues 