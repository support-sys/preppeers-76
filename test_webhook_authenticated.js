// Authenticated webhook test script
// This simulates what Cashfree would send

const ORDER_ID = "ORDER_0a1d6926-47b7-48b2-939b-346b003aa94e";
const WEBHOOK_URL = "https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook";

// Test webhook payload (simulating Cashfree webhook)
const webhookPayload = {
  type: "PAYMENT_SUCCESS_WEBHOOK",
  data: {
    order: {
      order_id: ORDER_ID,
      order_amount: "657.00",
      order_currency: "INR"
    },
    payment: {
      cf_payment_id: "TEST_PAYMENT_ID_123",
      payment_status: "SUCCESS"
    }
  }
};

async function testWebhook() {
  try {
    console.log('🧪 Testing webhook with Cashfree simulation...');
    console.log('📤 Sending to:', WEBHOOK_URL);
    
    // Simulate Cashfree webhook call (no auth required for webhooks)
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cashfree/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const result = await response.text();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', result);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('🔄 This should trigger auto-book-interview function');
    } else {
      console.log('❌ Webhook test failed!');
    }
    
  } catch (error) {
    console.error('💥 Error testing webhook:', error);
  }
}

// Run the test
testWebhook();
