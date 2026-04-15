import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'LessonLift <hello@lessonlift.co.uk>';

type EmailType = 'welcome' | 'resend-verification' | 'password-reset';

interface SendEmailRequest {
  type: EmailType;
  to: string;
  name?: string;
  plan?: string;
  verificationLink?: string;
  redirectTo?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');

    const payload: SendEmailRequest = await req.json();
    const { type, to, name, plan, verificationLink, redirectTo } = payload;

    if (type === 'password-reset') {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const siteUrl = Deno.env.get('SITE_URL') || 'https://lessonlift.co.uk';
      const resetRedirect = redirectTo || `${siteUrl}/reset-password`;

      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: to.trim(),
        options: { redirectTo: resetRedirect },
      });

      if (linkError) {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const resetLink = linkData?.properties?.action_link;
      if (!resetLink) {
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const html = buildPasswordResetEmail(resetLink);

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to.trim()],
          subject: 'Reset your LessonLift password',
          html,
        }),
      });

      if (!resendResponse.ok) {
        console.error('Resend error sending reset email');
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (type === 'resend-verification') {
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const siteUrl = Deno.env.get('SITE_URL') || 'https://lessonlift.co.uk';
      const { error: otpError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: user.email!,
        options: { redirectTo: `${siteUrl}/dashboard` },
      });

      if (otpError) {
        return new Response(
          JSON.stringify({ success: false, error: otpError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subject = '';
    let html = '';

    if (type === 'welcome') {
      const planLabel = getPlanLabel(plan || 'starter');
      subject = 'Welcome to LessonLift';
      html = buildWelcomeEmail(name || 'Teacher', planLabel);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown email type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(resendData.message || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    starter: 'Starter',
    standard: 'Standard',
    pro: 'Pro',
  };
  return labels[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
}

function buildEmailWrapper(content: string, footerNote?: string): string {
  const footerExtra = footerNote
    ? `<tr><td style="padding-top:16px;text-align:center;"><p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;">${footerNote}</p></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LessonLift</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px 16px 0 0;padding:32px 40px 24px;text-align:center;border-bottom:3px solid #4CAF50;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="background:#4CAF50;border-radius:10px;width:36px;height:36px;display:inline-block;vertical-align:middle;text-align:center;line-height:36px;">
                  <span style="color:white;font-size:20px;font-weight:bold;">L</span>
                </div>
                <span style="font-size:24px;font-weight:800;color:#1a1a1a;vertical-align:middle;margin-left:8px;">LessonLift</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#374151;">LessonLift</p>
                    <p style="margin:0 0 12px;font-size:13px;color:#9ca3af;">Helping teachers plan smarter.</p>
                    <p style="margin:0;font-size:12px;color:#d1d5db;">If you did not request this email, you can safely ignore it.</p>
                  </td>
                </tr>
                ${footerExtra}
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetEmail(resetLink: string): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.3;">
      Reset your password
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
      We received a request to reset the password for your LessonLift account.
      Click the button below to choose a new password.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="text-align:center;">
          <a href="${resetLink}"
             style="display:inline-block;background:#4CAF50;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
            Reset my password
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:13px;color:#9ca3af;line-height:1.6;">
      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will not be changed.
    </p>

    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
      If the button above doesn't work, copy and paste this link into your browser:<br />
      <a href="${resetLink}" style="color:#4CAF50;word-break:break-all;">${resetLink}</a>
    </p>
  `;

  return buildEmailWrapper(
    content,
    'Note: Occasionally this email may land in your spam/junk folder. If you don\'t see it in your inbox, please check there.'
  );
}

function buildWelcomeEmail(name: string, planLabel: string): string {
  const content = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.3;">
      Welcome to LessonLift, ${name}!
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      You're now on the <strong style="color:#4CAF50;">${planLabel} plan</strong> and ready to start generating high-quality lesson plans in seconds.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;padding:24px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 16px;font-size:15px;font-weight:700;color:#166534;">Inside LessonLift you can:</p>
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding:6px 0;">
                <span style="display:inline-block;width:20px;height:20px;background:#4CAF50;border-radius:50%;text-align:center;line-height:20px;font-size:12px;color:white;font-weight:bold;margin-right:10px;vertical-align:middle;">&#10003;</span>
                <span style="font-size:14px;color:#374151;vertical-align:middle;">Generate structured lesson plans instantly</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="display:inline-block;width:20px;height:20px;background:#4CAF50;border-radius:50%;text-align:center;line-height:20px;font-size:12px;color:white;font-weight:bold;margin-right:10px;vertical-align:middle;">&#10003;</span>
                <span style="font-size:14px;color:#374151;vertical-align:middle;">Save hours of planning every week</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="display:inline-block;width:20px;height:20px;background:#4CAF50;border-radius:50%;text-align:center;line-height:20px;font-size:12px;color:white;font-weight:bold;margin-right:10px;vertical-align:middle;">&#10003;</span>
                <span style="font-size:14px;color:#374151;vertical-align:middle;">Access your plans anytime from your dashboard</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="display:inline-block;width:20px;height:20px;background:#4CAF50;border-radius:50%;text-align:center;line-height:20px;font-size:12px;color:white;font-weight:bold;margin-right:10px;vertical-align:middle;">&#10003;</span>
                <span style="font-size:14px;color:#374151;vertical-align:middle;">Export plans in PDF, DOCX and more</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">
      Your monthly plan generation limit is shown in your dashboard so you always know how many you have left.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="text-align:center;">
          <a href="https://lessonlift.co.uk/dashboard/lesson-generator"
             style="display:inline-block;background:#4CAF50;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
            Start Generating Lesson Plans
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.7;">
      If you ever need help, just reply to this email and we'll help you out.
    </p>

    <p style="margin:24px 0 0;font-size:14px;color:#374151;">
      — The LessonLift Team
    </p>
  `;
  return buildEmailWrapper(content);
}
