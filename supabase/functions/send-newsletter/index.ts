import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BATCH_SIZE = 100;
const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get('x-admin-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    const adminKey = Deno.env.get('ADMIN_SECRET_KEY');
    if (!adminKey || auth !== adminKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { subject, body_html } = await req.json();
    if (!subject || !body_html) {
      return new Response(JSON.stringify({ error: 'subject and body_html required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridKey) {
      return new Response(JSON.stringify({ error: 'SENDGRID_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscribers, error: fetchError } = await supabase.from('subscribers').select('email');
    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscribers?.length) {
      return new Response(JSON.stringify({ message: 'No subscribers.', sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('newsletters').insert({
      subject,
      body_html,
      sent_at: new Date().toISOString(),
    });

    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'newsletter@thefightdontstop.com';
    const fromName = Deno.env.get('SENDGRID_FROM_NAME') ?? 'The Fight';

    const wrapHtml = (b: string) =>
      `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">${b}</body></html>`;

    let sent = 0;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const personalizations = batch.map((s: { email: string }) => ({ to: [{ email: s.email }] }));

      const res = await fetch(SENDGRID_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sendgridKey}`,
        },
        body: JSON.stringify({
          personalizations,
          from: { email: fromEmail, name: fromName },
          subject,
          content: [{ type: 'text/html', value: wrapHtml(body_html) }],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(JSON.stringify({ error: `SendGrid: ${err}`, sent }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      sent += batch.length;
    }

    return new Response(JSON.stringify({ message: `Sent to ${sent} subscribers.`, sent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
