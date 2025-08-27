// Simple script to process pending emails
// Run this manually or on a schedule

const SUPABASE_URL = 'https://jhhoeodofsbgfxndhotq.supabase.co';
const SERVICE_ROLE_KEY = 'your_service_role_key_here'; // Keep this secure

async function processPendingEmails() {
  try {
    // 1. Get pending emails from queue
    const response = await fetch(`${SUPABASE_URL}/rest/v1/email_queue?status=eq.pending`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const pendingEmails = await response.json();
    console.log(`Found ${pendingEmails.length} pending emails`);
    
    // 2. Process each email
    for (const email of pendingEmails) {
      try {
        // Call your edge function
        const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-interviewer-welcome`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'eligibility',
            interviewer_name: email.template_data.interviewer_name,
            interviewer_email: email.template_data.interviewer_email
          })
        });
        
        if (emailResponse.ok) {
          // Mark as sent
          await fetch(`${SUPABASE_URL}/rest/v1/email_queue?id=eq.${email.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
              'apikey': SERVICE_ROLE_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
          });
          
          console.log(`✅ Email sent to ${email.recipient_email}`);
        } else {
          throw new Error(`HTTP ${emailResponse.status}`);
        }
        
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${email.recipient_email}:`, emailError);
        
        // Mark as failed
        await fetch(`${SUPABASE_URL}/rest/v1/email_queue?id=eq.${email.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'failed',
            error_message: emailError.message,
            attempts: email.attempts + 1
          })
        });
      }
    }
    
  } catch (error) {
    console.error('Error processing emails:', error);
  }
}

// Run the function
processPendingEmails();
