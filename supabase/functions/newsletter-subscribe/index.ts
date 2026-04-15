import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'LessonLift <hello@lessonlift.co.uk>';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Invalid email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: upsertError } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email: email.trim().toLowerCase(), subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }
      );

    if (upsertError) {
      console.error('Error saving subscriber:', upsertError);
      return new Response(JSON.stringify({ error: 'Failed to save subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ success: true, emailSent: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = buildConfirmationEmail(email.trim());
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email.trim()],
        subject: "You're subscribed to LessonLift updates",
        html,
      }),
    });

    const resendData = await resendResponse.json();
    const emailSent = resendResponse.ok;

    if (emailSent) {
      await supabase
        .from('newsletter_subscribers')
        .update({ confirmed: true })
        .eq('email', email.trim().toLowerCase());
    } else {
      console.error('Resend API error:', resendData);
    }

    return new Response(JSON.stringify({ success: true, emailSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Newsletter subscribe error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildConfirmationEmail(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LessonLift Newsletter</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
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
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#1a1a1a;line-height:1.3;">
                You're on the list!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Thanks for subscribing to LessonLift updates. We'll keep you informed about new features,
                teaching tips, curriculum updates, and everything else happening at LessonLift.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#166534;">What to expect:</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;">&#10003;&nbsp; Teaching tips &amp; curriculum updates</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;">&#10003;&nbsp; New LessonLift feature announcements</p>
                    <p style="margin:4px 0;font-size:14px;color:#374151;">&#10003;&nbsp; Exclusive educator resources</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="text-align:center;">
                    <a href="https://lessonlift.co.uk"
                       style="display:inline-block;background:#4CAF50;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.3px;">
                      Visit LessonLift
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                If you didn't sign up for this, you can safely ignore this email. Your address was: ${email}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#374151;">LessonLift</p>
              <p style="margin:0;font-size:13px;color:#9ca3af;">Helping teachers plan smarter.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
