import { createHmac } from 'crypto';
import { env } from '$env/dynamic/private';

export function getPassword(): string {
  const b64 = env.ADMIN_PASSWORD_B64;
  if (b64) return Buffer.from(b64, 'base64').toString('utf8');
  return env.ADMIN_PASSWORD ?? '';
}

export function getAdminToken(): string {
  const pw = getPassword();
  if (!pw) return '';
  return createHmac('sha256', pw).update('admin_authenticated').digest('hex');
}

export function isAuthenticated(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  return cookieValue === getAdminToken();
}
