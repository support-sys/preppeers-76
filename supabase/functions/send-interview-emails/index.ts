import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const emailData = await req.json();
    console.log("Sending interview email:", emailData.type);
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Resend API key not configured");
    }
    const resend = new Resend(resendApiKey);
    const formattedDate = new Date(emailData.scheduledTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    if (emailData.type === 'confirmation') {
      // Send confirmation email to candidate
      console.log("Sending confirmation email to candidate:", emailData.candidateEmail);
      const candidateResult = await resend.emails.send({
        from: "Interviewise Platform <support@interviewise.in>",
        to: [
          emailData.candidateEmail
        ],
        cc: [
          "support@interviewise.in"
        ],
        subject: `Interviewise Mock Interview Confirmed: ${emailData.targetRole}`,
        html: `
          <h1>Your Interview is Confirmed!</h1>
          <p>Dear ${emailData.candidateName},</p>
          <p>Your mock interview has been successfully scheduled:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Interview Details</h3>
            <p><strong>Position:</strong> ${emailData.targetRole}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Interviewer:</strong> ${emailData.interviewerName}</p>
            <p><strong>How to join:</strong> Please open your 
              <a href="https://interviewise.netlify.app/dashboard" target="_blank">Interviewise Dashboard</a> 
              and click <em>Join Meeting</em> for this interview.
            </p>
          </div>
          <p>Please join the meeting a few minutes early to test your audio and video.</p>
          <p>Turn on camera throught the interview</p>
          <p>Good luck with your interview!</p>
          <p>Best regards,<br>The Interview Platform Team</p>
        `
      });
      if (candidateResult.error) {
        console.error("Failed to send candidate email:", candidateResult.error);
        throw new Error(`Failed to send candidate email: ${candidateResult.error.message}`);
      }
      console.log("Candidate email sent successfully:", candidateResult.data?.id);
      // Send notification to interviewer
      console.log("Sending notification email to interviewer:", emailData.interviewerEmail);
      const interviewerResult = await resend.emails.send({
        from: "Interview Platform <support@interviewise.in>",
        to: [
          emailData.interviewerEmail
        ],
        cc: [
          "support@interviewise.in"
        ],
        subject: `Interviewise New Mock Interview Scheduled: ${emailData.targetRole}`,
        html: `
          <h1>New Interview Scheduled</h1>
          <p>Dear ${emailData.interviewerName},</p>
          <p>A new interview has been scheduled with you:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Interview Details</h3>
            <p><strong>Candidate:</strong> ${emailData.candidateName} (${emailData.candidateEmail})</p>
            <p><strong>Position:</strong> ${emailData.targetRole}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>How to join:</strong> Please open your 
              <a href="https://interviewise.netlify.app/dashboard" target="_blank">Interviewise Dashboard</a> 
              and click <em>Join Meeting</em> for this interview.
            </p>
          </div>
          <p>Please be prepared to conduct the interview at the scheduled time.</p>
          <p>Turn on camera throught the interview</p>
          <p>Best regards,<br>The Interview Platform Team</p>
        `
      });
      if (interviewerResult.error) {
        console.error("Failed to send interviewer email:", interviewerResult.error);
        throw new Error(`Failed to send interviewer email: ${interviewerResult.error.message}`);
      }
      console.log("Interviewer email sent successfully:", interviewerResult.data?.id);
    } else if (emailData.type === 'reminder') {
      // Send reminder email to candidate
      console.log("Sending reminder email to candidate:", emailData.candidateEmail);
      const reminderResult = await resend.emails.send({
        from: "Interviewise Platform <support@interviewise.in>",
        to: [
          emailData.candidateEmail
        ],
        cc: [
          "support@interviewise.in"
        ],
        subject: `Interview Reminder: ${emailData.targetRole} - Tomorrow`,
        html: `
          <h1>Interview Reminder</h1>
          <p>Dear ${emailData.candidateName},</p>
          <p>This is a reminder that your interview is scheduled for tomorrow:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Interview Details</h3>
            <p><strong>Position:</strong> ${emailData.targetRole}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Interviewer:</strong> ${emailData.interviewerName}</p>
            <p><strong>How to join:</strong> Please open your 
              <a href="https://interviewise.netlify.app/dashboard" target="_blank">Interviewise Dashboard</a> 
              and click <em>Join Meeting</em> for this interview.
            </p>
          </div>
          <p>Tips for your interview:</p>
          <ul>
            <li>Test your camera and microphone beforehand</li>
            <li>Join the meeting 5 minutes early</li>
            <li>Have your resume ready to discuss</li>
            <li>Prepare questions about the role</li>
            <li>Turn on camera throught the interview</li>
          </ul>
          <p>Good luck!</p>
          <p>Best regards,<br>The Interview Platform Team</p>
        `
      });
      if (reminderResult.error) {
        console.error("Failed to send reminder email:", reminderResult.error);
        throw new Error(`Failed to send reminder email: ${reminderResult.error.message}`);
      }
      console.log("Reminder email sent successfully:", reminderResult.data?.id);
    } else if (emailData.type === 'feedback_reminder') {
      // Send feedback reminder email to interviewer
      console.log("Sending feedback reminder email to interviewer:", emailData.interviewerEmail);
      const feedbackReminderResult = await resend.emails.send({
        from: "Interviewise Platform <support@interviewise.in>",
        to: [
          emailData.interviewerEmail
        ],
        cc: [
          "support@interviewise.in"
        ],
        subject: `Interview Completed - Please Submit Feedback | ${emailData.targetRole}`,
        html: `
          <h1>Interview Completed - Feedback Required</h1>
          <p>Dear ${emailData.interviewerName},</p>
          <p>Thank you for conducting the interview! The following interview session has been completed:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Interview Details</h3>
            <p><strong>Candidate:</strong> ${emailData.candidateName} (${emailData.candidateEmail})</p>
            <p><strong>Position:</strong> ${emailData.targetRole}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Experience Level:</strong> ${emailData.experience || 'Not specified'}</p>
          </div>
          <p><strong>📝 Please Submit Your Feedback</strong></p>
          <p>Your feedback is crucial for helping candidates improve their interview skills. Please follow these steps:</p>
          <ol>
            <li>Log in to your <a href="https://interviewise.netlify.app/dashboard" target="_blank" style="color: #2754C5; text-decoration: underline;">Interviewise Dashboard</a></li>
            <li>Go to the <strong>"Past Interviews"</strong> section</li>
            <li>Find this interview and click <strong>"Submit Feedback"</strong></li>
            <li>Complete the feedback form with your assessment</li>
          </ol>
          <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2754C5;">
            <p style="margin: 0; color: #1a365d;"><strong>💡 Reminder:</strong> Quality feedback helps candidates understand their strengths and areas for improvement, making their next interview experience more successful.</p>
          </div>
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Thank you for being part of the Interviewise community!</p>
          <p>Best regards,<br>The Interviewise Platform Team</p>
        `
      });
      if (feedbackReminderResult.error) {
        console.error("Failed to send feedback reminder email:", feedbackReminderResult.error);
        throw new Error(`Failed to send feedback reminder email: ${feedbackReminderResult.error.message}`);
      }
      console.log("Feedback reminder email sent successfully:", feedbackReminderResult.data?.id);
    }
    console.log("Email sent successfully");
    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in send-interview-emails function:", error);
    return new Response(JSON.stringify({
      error: "Failed to send email",
      details: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
