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
  technologies: string[];
  payout_method: string;
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
    const technologiesList = emailData.technologies.join(", ");

    const emailResponse = await resend.emails.send({
      from: "InterviewWise <onboarding@resend.dev>",
      to: [emailData.interviewer_email],
      subject: "🎉 Welcome to InterviewWise - Assessment & Onboarding Details",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Welcome to InterviewWise!</h1>
              <p style="font-size: 18px; color: #666;">Thank you for joining our interviewer community</p>
            </div>
            
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #1e40af; margin-top: 0;">Dear ${emailData.interviewer_name},</h2>
              <p>We're thrilled to have you on board as a professional interviewer! Your expertise in <strong>${emailData.company}</strong> as a <strong>${emailData.position}</strong> will be invaluable to our candidates.</p>
              
              <h3 style="color: #1e40af; margin-top: 25px;">🔍 Next Steps - Assessment Process</h3>
              <p>To ensure the highest quality interviews for our candidates, we have a quick assessment process:</p>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb;">
                <h4 style="margin-top: 0; color: #1e40af;">📋 Technical Skills Assessment</h4>
                <p>Complete a brief technical evaluation to showcase your expertise in your domain.</p>
                <p><strong>Assessment Link:</strong> <em>[Assessment link will be provided shortly]</em></p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a;">
                <h4 style="margin-top: 0; color: #16a34a;">🤝 Discovery Session</h4>
                <p>A brief one-on-one session with our team to understand your interviewing style and preferences.</p>
                <p><strong>Booking Link:</strong> <em>[Discovery session link will be provided shortly]</em></p>
              </div>
              
              <div style="background: #dbeafe; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #1e40af;">✅ Once you complete both steps, you'll be eligible to start conducting interviews and earning with us!</p>
              </div>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin-top: 0;">Your Profile Summary</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>Experience:</strong> ${emailData.experience_years} years</li>
                <li style="margin: 8px 0;"><strong>Company:</strong> ${emailData.company}</li>
                <li style="margin: 8px 0;"><strong>Position:</strong> ${emailData.position}</li>
                <li style="margin: 8px 0;"><strong>Skills:</strong> ${skillsList}</li>
                <li style="margin: 8px 0;"><strong>Technologies:</strong> ${technologiesList}</li>
                <li style="margin: 8px 0;"><strong>Payout Method:</strong> ${emailData.payout_method}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; margin-bottom: 20px;">We'll contact you soon with your assessment details. Thank you for choosing to make a difference in candidates' careers!</p>
              <p style="color: #888; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                Best regards,<br>
                <strong>The InterviewWise Team</strong><br>
                <a href="mailto:support@interviewise.in" style="color: #2563eb;">support@interviewise.in</a>
              </p>
            </div>
          </body>
        </html>
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