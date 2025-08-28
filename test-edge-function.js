// Test script for the create-payment-session edge function
const testEdgeFunction = async () => {
  const url = 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/create-payment-session';
  
  const testData = {
    amount: 499,
    currency: 'INR',
    customer_id: 'test@example.com',
    customer_name: 'Test User',
    customer_email: 'test@example.com',
    customer_phone: '+919999999999',
    order_id: 'ORDER_TEST_123',
    return_url: 'http://localhost:3000/test',
    notify_url: 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/payment-webhook',
    selected_plan: 'essential',
    plan_details: {
      id: 'essential',
      name: 'Essential',
      duration: 30,
      price: 499
    }
  };

  try {
    console.log('Testing edge function with data:', testData);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // You'll need to replace this
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('Error testing edge function:', error);
  }
};

// Run the test
testEdgeFunction();
