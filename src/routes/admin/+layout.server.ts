import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isAuthenticated } from '$lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

function supabase() {
  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env');
  return createClient(url, key);
}

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  if (url.pathname === '/admin/login') return {};
  const token = cookies.get('admin_session');
  if (!isAuthenticated(token)) {
    throw redirect(302, '/admin/login');
  }
  try {
    const db = supabase();
    const [newslettersRes, subscribersRes] = await Promise.all([
      db.from('newsletters').select('id, subject, body_html, sent_at, created_at').order('created_at', { ascending: false }),
      db.from('subscribers').select('id, email, subscribed_at').order('subscribed_at', { ascending: false }),
    ]);
    return {
      newsletters: newslettersRes.data ?? [],
      subscribers: subscribersRes.data ?? [],
      loadError: newslettersRes.error || subscribersRes.error ? (newslettersRes.error?.message || subscribersRes.error?.message) : null,
    };
  } catch (e) {
    return {
      newsletters: [],
      subscribers: [],
      loadError: e instanceof Error ? e.message : 'Failed to load data',
    };
  }
};
