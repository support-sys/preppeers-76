import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-database-trigger"
};

// Function to verify if request is from database trigger
const verifyDatabaseTrigger = (req) => {
  const authHeader = req.headers.get('authorization');
  const triggerHeader = req.headers.get('x-database-trigger');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  // Check if it's from database trigger
  if (triggerHeader === 'true') {
    // Verify anon key is correct
    if (authHeader === `Bearer ${supabaseAnonKey}`) {
      return true;
    }
  }
  
  // Check if it's using service role key (for regular calls)
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (authHeader === `Bearer ${supabaseServiceKey}`) {
    return true;
  }
  
  return false;
};

const handler = async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    // Verify authentication for database triggers
    if (!verifyDatabaseTrigger(req)) {
      console.log("Unauthorized request");
      return new Response(JSON.stringify({
        error: "Unauthorized"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const emailData = await req.json();
    console.log("Sending email to:", emailData.interviewer_email, "Type:", emailData.type);
    
    // Check if this is an eligibility email or regular welcome email
    if (emailData.type === 'eligibility') {
      // Send eligibility/approval email
      const emailResponse = await resend.emails.send({
        from: "IntervieWise <support@interviewise.in>",
        to: [emailData.interviewer_email],
        cc: ["support@interviewise.in"],
        subject: "You're In! Welcome to Interviewise — Set Your Availability",
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 You're In!</h1>
                <p style="font-size: 18px; color: #666;">Welcome to Interviewise</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #1e40af; margin-top: 0;">Hi ${emailData.interviewer_name},</h2>
                <p>Great news — you've passed the assessment and are now onboarded as an interviewer on Interviewise. 🎉</p>
                
                <div style="background: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h3 style="color: #1e40af; margin-top: 0;">Next step (required):</h3>
                  <ol style="color: #1e40af; padding-left: 20px;">
                    <li>Go to your Dashboard → Manage Schedule.</li>
                    <li>Select the days you're available.</li>
                    <li>Add time slots for each selected day (you can set multiple slots).</li>
                    <li>Save your schedule.</li>
                  </ol>
                </div>
                
                <p>Once your availability is set, you'll start receiving interview requests that match your expertise and time slots.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://interviewise.in/dashboard" 
                     style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Go to your Dashboard
                  </a>
                </div>
                
                <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <h4 style="color: #1e40af; margin-top: 0;">Tips:</h4>
                  <ul style="color: #555;">
                    <li>Keep at least 5–8 hours per week open to maximize bookings.</li>
                    <li>Update your schedule regularly if your availability changes.</li>
                  </ul>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; margin-bottom: 20px;">If you have any questions, reply to this email or reach us at support@interviewise.in</p>
                <p style="color: #888; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                  Welcome aboard,<br>
                  <strong>Team Interviewise</strong><br>
                  <a href="https://www.interviewise.in" style="color: #2563eb;">www.interviewise.in</a>
                </p>
              </div>
            </body>
          </html>
        `
      });
      
      console.log("Eligibility email sent successfully:", emailResponse);
      return new Response(JSON.stringify({
        success: true,
        type: 'eligibility',
        emailId: emailResponse.data?.id
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Regular welcome email (existing functionality)
    const skillsList = emailData.skills.join(", ");
    const technologiesList = emailData.technologies.join(", ");
    const emailResponse = await resend.emails.send({
      from: "IntervieWise <support@interviewise.in>",
      to: [
        emailData.interviewer_email
      ],
      cc: [
        "support@interviewise.in"
      ],
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
                <p><strong>Assessment Link:</strong> 
                 <a href="https://forms.gle/axj5Pkam36sgMYyA7" target="_blank" style="color: blue; text-decoration: underline;">
                  Start Assessment
                 </a>
                </p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #16a34a;">
                <h4 style="margin-top: 0; color: #16a34a;">🤝 Discovery Session</h4>
                <p>A brief one-on-one session with our team to understand your interviewing style and preferences.</p>
                <p><strong>Booking Link:</strong> 
                 <a href="https://calendly.com/interviewise-support/30min" target="_blank" style="color: blue; text-decoration: underline;">
                    https://calendly.com/interviewise-support/30min
                 </a>
                </p>
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
      `
    });
    console.log("Welcome email sent successfully:", emailResponse);
    return new Response(JSON.stringify({
      success: true,
      type: 'welcome',
      emailId: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("Error in send-interviewer-welcome function:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
};
serve(handler);
