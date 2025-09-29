// Test webhook with Supabase API key
const ORDER_ID = "ORDER_0a1d6926-47b7-48b2-939b-346b003aa94e";
const WEBHOOK_URL = "https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook";

// You'll need to get your Supabase anon key from the dashboard
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE"; // Replace with actual key

const cashfreeWebhookPayload = {
  type: "PAYMENT_SUCCESS_WEBHOOK",
  data: {
    order: {
      order_id: ORDER_ID,
      order_amount: "657.00",
      order_currency: "INR",
      order_status: "PAID"
    },
    payment: {
      cf_payment_id: "TEST_PAYMENT_ID_123",
      payment_status: "SUCCESS",
      payment_amount: "657.00",
      payment_currency: "INR"
    }
  }
};

async function testWebhookWithApiKey() {
  try {
    console.log('🧪 Testing webhook with API key...');
    
    if (SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY_HERE") {
      console.log('❌ Please set your Supabase anon key in the script');
      console.log('📝 Get it from: https://supabase.com/dashboard/project/kqyynigirebbggphstac/settings/api');
      return;
    }
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'User-Agent': 'Cashfree/1.0'
      },
      body: JSON.stringify(cashfreeWebhookPayload)
    });
    
    const result = await response.text();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', result);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
    
  } catch (error) {
    console.error('💥 Error testing webhook:', error);
  }
}

testWebhookWithApiKey();
