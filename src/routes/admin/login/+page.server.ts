import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAdminToken, isAuthenticated, getPassword } from '$lib/admin-auth';

export const load: PageServerLoad = async ({ cookies }) => {
  if (isAuthenticated(cookies.get('admin_session'))) {
    throw redirect(302, '/admin');
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const password = (formData.get('password') as string) ?? '';
    const expected = getPassword();
    if (!expected || password !== expected) {
      return fail(401, { error: 'Invalid password' });
    }
    const token = getAdminToken();
    if (!token) return fail(500, { error: 'Server error' });
    cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production',
    });
    throw redirect(302, '/admin');
  },
};
