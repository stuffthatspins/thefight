import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

export const actions: Actions = {
  subscribe: async ({ request }) => {
    const formData = await request.formData();
    const email = (formData.get('email') as string)?.trim()?.toLowerCase();
    if (!email) {
      return fail(400, { error: 'Email required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, { error: 'Invalid email' });
    }

    const url = PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return fail(500, { error: 'Server configuration error' });
    }

    const supabase = createClient(url, key);
    const { error } = await supabase.from('subscribers').insert({ email });

    if (error) {
      if (error.code === '23505') {
        return { subscribed: false, message: "You're already on the list." };
      }
      return fail(500, { error: 'Something went wrong. Try again.' });
    }
    return { subscribed: true, message: "YOU'RE IN. STAY TUNED." };
  },
};
