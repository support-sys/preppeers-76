// Test script that simulates exact Cashfree webhook format
const ORDER_ID = "ORDER_0a1d6926-47b7-48b2-939b-346b003aa94e";
const WEBHOOK_URL = "https://kqyynigirebbggphstac.supabase.co/functions/v1/payment-webhook";

// Simulate exact Cashfree webhook payload format
const cashfreeWebhookPayload = {
  type: "PAYMENT_SUCCESS_WEBHOOK",
  data: {
    order: {
      order_id: ORDER_ID,
      order_amount: "657.00",
      order_currency: "INR",
      order_status: "PAID",
      order_meta: {
        return_url: "https://your-website.com/return",
        notify_url: "https://your-website.com/notify"
      }
    },
    payment: {
      cf_payment_id: "TEST_PAYMENT_ID_123",
      payment_status: "SUCCESS",
      payment_amount: "657.00",
      payment_currency: "INR",
      payment_time: "2025-09-29T14:08:25.718Z",
      payment_method: "card",
      payment_group: "credit_card"
    },
    customer_details: {
      customer_id: "customer_test_123",
      customer_email: "test@example.com",
      customer_name: "Test User"
    }
  }
};

async function testCashfreeWebhook() {
  try {
    console.log('🧪 Testing with Cashfree webhook format...');
    console.log('📤 Sending to:', WEBHOOK_URL);
    console.log('📦 Payload type:', cashfreeWebhookPayload.type);
    
    // Simulate Cashfree webhook headers
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cashfree/1.0',
        'X-CF-Signature': 'test_signature', // Cashfree signature header
        'X-Forwarded-For': '127.0.0.1'
      },
      body: JSON.stringify(cashfreeWebhookPayload)
    });
    
    const result = await response.text();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('📥 Response Body:', result);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
      console.log('🔄 This should trigger auto-book-interview function');
    } else {
      console.log('❌ Webhook test failed!');
      console.log('💡 Make sure the webhook function is publicly accessible');
    }
    
  } catch (error) {
    console.error('💥 Error testing webhook:', error);
  }
}

// Run the test
testCashfreeWebhook();
