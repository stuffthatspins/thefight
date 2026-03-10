import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

const BATCH_SIZE = 100;
const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send';

function supabase() {
  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');
  return createClient(url, key);
}

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const subject = (form.get('subject') as string)?.trim();
    const body_html = (form.get('body_html') as string)?.trim();
    if (!subject || !body_html) return fail(400, { createError: 'Subject and body required' });
    const { error } = await supabase().from('newsletters').insert({ subject, body_html });
    if (error) return fail(500, { createError: error.message });
    return { createSuccess: true };
  },
  update: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    const subject = (form.get('subject') as string)?.trim();
    const body_html = (form.get('body_html') as string)?.trim();
    if (!id || !subject || !body_html) return fail(400, { updateError: 'Missing fields' });
    const { error } = await supabase().from('newsletters').update({ subject, body_html }).eq('id', id);
    if (error) return fail(500, { updateError: error.message });
    return { updateSuccess: true };
  },
  delete: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    if (!id) return fail(400, { deleteError: 'Missing id' });
    const { error } = await supabase().from('newsletters').delete().eq('id', id);
    if (error) return fail(500, { deleteError: error.message });
    return { deleteSuccess: true };
  },
  send: async ({ request }) => {
    const form = await request.formData();
    const id = form.get('id') as string;
    if (!id) return fail(400, { sendError: 'Missing newsletter id' });

    const db = supabase();
    const { data: newsletter, error: nErr } = await db.from('newsletters').select('subject, body_html').eq('id', id).single();
    if (nErr || !newsletter) return fail(404, { sendError: 'Newsletter not found' });

    const { data: subscribers, error: sErr } = await db.from('subscribers').select('email');
    if (sErr) return fail(500, { sendError: sErr.message });
    if (!subscribers?.length) return fail(400, { sendError: 'No subscribers' });

    const key = env.SENDGRID_API_KEY;
    if (!key) return fail(500, { sendError: 'SENDGRID_API_KEY not set' });

    const fromEmail = env.SENDGRID_FROM_EMAIL || 'newsletter@thefightdontstop.com';
    const fromName = env.SENDGRID_FROM_NAME || 'The Fight';
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">${newsletter.body_html}</body></html>`;

    let sent = 0;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      const personalizations = batch.map((s) => ({ to: [{ email: s.email }] }));
      const res = await fetch(SENDGRID_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          personalizations,
          from: { email: fromEmail, name: fromName },
          subject: newsletter.subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      if (!res.ok) return fail(500, { sendError: `SendGrid: ${await res.text()}`, sendCount: sent });
      sent += batch.length;
    }

    await db.from('newsletters').update({ sent_at: new Date().toISOString() }).eq('id', id);
    return { sendSuccess: true, sendCount: sent };
  },
};
