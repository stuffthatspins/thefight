# The Fight

Newsletter site with Svelte frontend, Supabase storage, and SendGrid delivery.

## Stack

- **SvelteKit** – frontend and server
- **Supabase** – PostgreSQL for subscribers and newsletters
- **SendGrid** – batched email delivery

## Setup

1. **Environment**

   Copy `.env.example` to `.env` and fill in values:

   - `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` – from Supabase project settings
   - `SUPABASE_SERVICE_ROLE_KEY` – for server-side admin operations
   - `SENDGRID_API_KEY` – SendGrid API key (Mail Send)
   - `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` – sender details
   - `ADMIN_SECRET_KEY` – secret used when sending newsletters from `/admin`

2. **Supabase database**

   Run the migrations in `supabase/migrations/` (via Supabase Dashboard SQL editor or `supabase db push`):

   - `00001_create_subscribers.sql`
   - `00002_create_newsletters.sql`

3. **Logo**

   Place your logo at `static/logo.png` (referenced on the homepage).

## Development

```bash
npm install
npm run dev
```

## Admin

Go to `/admin` and use the form to compose and send newsletters. Enter your `ADMIN_SECRET_KEY` in the Admin key field when sending.

## Supabase Edge Function (optional)

A SendGrid-based edge function lives in `supabase/functions/send-newsletter/`. You can deploy it and call it instead of the built-in form action by setting env vars in Supabase and sending:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-newsletter \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Hi","body_html":"<p>Hello</p>"}'
```
