import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return json({ error: 'Email required' }, { status: 400 });
    }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL!,
      process.env.PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.from('subscribers').insert({ email: trimmed });

    if (error) {
      if (error.code === '23505') return json({ message: "You're already on the list." }, { status: 200 });
      throw error;
    }
    return json({ message: "You're in. Stay tuned..." }, { status: 201 });
  } catch (e) {
    return json({ error: 'Something went wrong' }, { status: 500 });
  }
};
