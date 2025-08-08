// Test script to manually trigger the webhook
const testWebhook = async () => {
  const webhookUrl = 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook';
  
  // Test data based on the webhook you received
  const testData = {
    order_id: "ORDER_9bfae8b9-c434-4cde-85ea-697495caa979",
    payment_status: "successful", // Changed from "success" to "successful" to match database enum
    payment_id: "5114919750104"
  };

  try {
    console.log('Testing webhook with data:', testData);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Webhook response:', result);
    console.log('Response status:', response.status);
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
};

// Run the test
testWebhook(); 