# 🔐 Security Setup Guide

## Required: Set Environment Variables in Vercel

Before deploying, add these environment variables in your **Vercel Project Settings → Environment Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `QR_SECRET` | `PapayaJuice2025!` | Change this to a new random secret! |

### How to set them:
1. Go to [vercel.com](https://vercel.com) → Your Project → **Settings** → **Environment Variables**
2. Add `QR_SECRET` with a strong random value (e.g. generate with `openssl rand -base64 32`)
3. Redeploy

---

## Fix 1: Auth Guard on Dashboard Pages ✅

`dashboard/categories.html` and `dashboard/reclamations.html` now check `sessionStorage` before loading.
Any direct URL access redirects to `/dashboard` (login page).

## Fix 2: QR Secret Moved Server-Side ✅

`_QR_SECRET` is no longer hardcoded in `menu.html` or `qr-tables.html`.
Validation and generation now happens via:
- `POST /api/verify-qr` — validates a token from `?t=...` URL param
- `POST /api/generate-qr-token` — generates a new token for a table number

Both serverless functions read `QR_SECRET` from the environment.

## Fix 3: Supabase anon key ✅ (by design)

The Supabase **anon key** is intentionally public in JAMstack apps — it's designed to be.
Security is enforced via **Row Level Security (RLS)** on your Supabase tables.

**Make sure RLS is enabled on ALL tables** in your Supabase dashboard:
- `products`
- `categories`
- `orders`
- `personnel`
- `reclamations`

In Supabase: **Table Editor → [table] → RLS → Enable RLS**

For public read (menu):
```sql
CREATE POLICY "Public read menu" ON products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
```

For authenticated write (dashboard):
```sql
CREATE POLICY "Auth write only" ON products FOR ALL USING (auth.role() = 'authenticated');
```
