import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  interviewer_name: string;
  interviewer_email: string;
  company: string;
  position: string;
  experience_years: number;
  skills: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: WelcomeEmailRequest = await req.json();
    console.log("Sending welcome email to:", emailData.interviewer_email);

    const skillsList = emailData.skills.join(", ");

    const emailResponse = await resend.emails.send({
      from: "InterviewAce <onboarding@resend.dev>",
      to: [emailData.interviewer_email],
      subject: "Welcome to InterviewAce - Your Expert Profile is Ready!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">Welcome to InterviewAce!</h1>
          
          <p>Dear ${emailData.interviewer_name},</p>
          
          <p>Thank you for joining InterviewAce as an expert interviewer! We're excited to have you on board.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Your Profile Summary:</h3>
            <p><strong>Name:</strong> ${emailData.interviewer_name}</p>
            <p><strong>Company:</strong> ${emailData.company}</p>
            <p><strong>Position:</strong> ${emailData.position}</p>
            <p><strong>Experience:</strong> ${emailData.experience_years} years</p>
            <p><strong>Skills:</strong> ${skillsList}</p>
          </div>
          
          <h3 style="color: #1e40af;">Next Steps:</h3>
          <ul>
            <li>Your profile is now live and candidates can book interviews with you</li>
            <li>You'll receive email notifications when interviews are scheduled</li>
            <li>Make sure to keep your availability calendar updated</li>
            <li>Check your dashboard regularly for upcoming interviews</li>
          </ul>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Important:</strong> Your payout details have been recorded. Once verified by our team, you'll be able to receive payments for completed interviews. If you need to change your payout information, please contact our support team at <a href="mailto:support@interviewise.in">support@interviewise.in</a></p>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="https://preview--preppeers-76.lovable.app/dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Your Dashboard
            </a>
          </p>
          
          <p style="text-align: center; color: #6b7280; margin-top: 30px;">
            Best regards,<br>
            The InterviewAce Team<br>
            <a href="mailto:support@interviewise.in">support@interviewise.in</a>
          </p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-interviewer-welcome function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);