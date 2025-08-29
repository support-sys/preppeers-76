# 🔧 Cashfree Credentials Setup Guide

## 🎯 **Overview**

This guide explains how to set up separate test and production credentials for Cashfree in your interview platform. The system now automatically switches between test and production credentials based on the `CASHFREE_TEST_MODE` environment variable.

## 🔑 **Environment Variables Required**

### **Test Mode Credentials**
```bash
# Test/Sandbox Mode
CASHFREE_TEST_MODE=true
CASHFREE_APP_ID_TEST=your_test_app_id_here
CASHFREE_SECRET_KEY_TEST=your_test_secret_key_here
```

### **Production Mode Credentials**
```bash
# Production Mode
CASHFREE_TEST_MODE=false
CASHFREE_APP_ID=your_production_app_id_here
CASHFREE_SECRET_KEY=your_production_secret_key_here
```

## 🚀 **How It Works**

### **Automatic Mode Detection**
The system automatically detects which mode to use:

1. **If `CASHFREE_TEST_MODE=true`** → Uses test credentials
2. **If `CASHFREE_TEST_MODE=false` or not set** → Uses production credentials
3. **If `NODE_ENV=development`** → Automatically uses test mode

### **Credential Selection Logic**
```typescript
// Determine if we're in test mode
const isTestMode = Deno.env.get('CASHFREE_TEST_MODE') === 'true' || 
                   Deno.env.get('NODE_ENV') === 'development';

// Use appropriate credentials based on test mode
if (isTestMode) {
  // Use test credentials
  cashfreeAppId = Deno.env.get('CASHFREE_APP_ID_TEST');
  cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY_TEST');
  console.log('🔧 TEST MODE: Using test credentials');
} else {
  // Use production credentials
  cashfreeAppId = Deno.env.get('CASHFREE_APP_ID');
  cashfreeSecretKey = Deno.env.get('CASHFREE_SECRET_KEY');
  console.log('🚀 PRODUCTION MODE: Using production credentials');
}
```

## 🔧 **Setup Instructions**

### **Step 1: Get Cashfree Credentials**

#### **Test Credentials (Sandbox)**
1. **Login to** [Cashfree Merchant Portal](https://merchant.cashfree.com/)
2. **Go to** Settings → API Keys
3. **Copy** your **Test App ID** and **Test Secret Key**
4. **Note:** These are different from production credentials

#### **Production Credentials**
1. **In the same portal**, go to Settings → API Keys
2. **Copy** your **Production App ID** and **Production Secret Key**
3. **Note:** These are for live transactions

### **Step 2: Set Environment Variables in Supabase**

1. **Go to** your Supabase project dashboard
2. **Navigate to** Settings → API → Edge Functions
3. **Add these environment variables:**

   **For Test Mode:**
   ```
   CASHFREE_TEST_MODE: true
   CASHFREE_APP_ID_TEST: [YOUR_TEST_APP_ID]
   CASHFREE_SECRET_KEY_TEST: [YOUR_TEST_SECRET_KEY]
   ```

   **For Production Mode:**
   ```
   CASHFREE_TEST_MODE: false
   CASHFREE_APP_ID: [YOUR_PRODUCTION_APP_ID]
   CASHFREE_SECRET_KEY: [YOUR_PRODUCTION_SECRET_KEY]
   ```

### **Step 3: Verify Configuration**

After setting the environment variables:

1. **Deploy your edge functions** to Supabase
2. **Test with a sample payment** to verify credentials are working
3. **Check the logs** to confirm the correct mode is being used

## 🧪 **Testing the Setup**

### **Test Mode Verification**
When `CASHFREE_TEST_MODE=true`, you should see:
```
🔧 TEST MODE: Using test credentials
Using Cashfree TEST App ID: test_app_id_123
API URL: https://sandbox.cashfree.com/pg/orders
Mode: TEST/SANDBOX
```

### **Production Mode Verification**
When `CASHFREE_TEST_MODE=false`, you should see:
```
🚀 PRODUCTION MODE: Using production credentials
Using Cashfree PRODUCTION App ID: prod_app_id_456
API URL: https://api.cashfree.com/pg/orders
Mode: PRODUCTION
```

## 🔄 **Switching Between Modes**

### **To Switch to Test Mode:**
```bash
CASHFREE_TEST_MODE=true
```

### **To Switch to Production Mode:**
```bash
CASHFREE_TEST_MODE=false
```

### **Automatic Development Mode:**
```bash
NODE_ENV=development
# This automatically enables test mode
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Missing Cashfree test credentials"**
**Solution:** Ensure `CASHFREE_APP_ID_TEST` and `CASHFREE_SECRET_KEY_TEST` are set when `CASHFREE_TEST_MODE=true`

### **Issue 2: "Missing Cashfree production credentials"**
**Solution:** Ensure `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` are set when `CASHFREE_TEST_MODE=false`

### **Issue 3: "Mode not switching correctly"**
**Solution:** 
- Check if `CASHFREE_TEST_MODE` is set correctly
- Verify environment variables are saved and deployed
- Check edge function logs for mode detection

### **Issue 4: "Wrong API URL being used"**
**Solution:** The system automatically selects the correct URL based on mode:
- Test mode: `https://sandbox.cashfree.com/pg/orders`
- Production mode: `https://api.cashfree.com/pg/orders`

## 📊 **Environment Variable Reference**

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CASHFREE_TEST_MODE` | Yes | Controls which credentials to use | `true` or `false` |
| `CASHFREE_APP_ID_TEST` | Yes* | Test App ID from Cashfree | `test_app_123` |
| `CASHFREE_SECRET_KEY_TEST` | Yes* | Test Secret Key from Cashfree | `test_secret_456` |
| `CASHFREE_APP_ID` | Yes* | Production App ID from Cashfree | `prod_app_789` |
| `CASHFREE_SECRET_KEY` | Yes* | Production Secret Key from Cashfree | `prod_secret_012` |

*Required based on the mode you're using

## 🎯 **Best Practices**

### **1. Never Mix Credentials**
- Test credentials should only be used in test mode
- Production credentials should only be used in production mode
- Never use test credentials for live transactions

### **2. Secure Storage**
- Store credentials securely in environment variables
- Never commit credentials to version control
- Use Supabase's secure environment variable storage

### **3. Testing**
- Always test with test credentials first
- Verify test mode works before switching to production
- Use test card numbers for testing

### **4. Monitoring**
- Monitor logs to ensure correct mode is being used
- Set up alerts for credential-related errors
- Regularly verify environment variable configuration

## 🚀 **Next Steps**

1. **Set up your Cashfree merchant account** if you haven't already
2. **Get both test and production credentials** from Cashfree
3. **Configure environment variables** in Supabase
4. **Test the setup** with a sample payment
5. **Verify mode switching** works correctly
6. **Deploy to production** when ready

## 🔗 **Useful Links**

- [Cashfree Merchant Portal](https://merchant.cashfree.com/)
- [Cashfree API Documentation](https://docs.cashfree.com/docs/)
- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)

Your payment system is now ready to handle both test and production environments seamlessly! 🎯
