# Supabase Database Setup for SendQuote

Follow these steps to initialize your database. You only need to do this once.

## Step 1: Run the schema in Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `vfvvtiwaolyckoncvfdg`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy-paste the entire contents of `supabase/migrate_schema.sql`
6. Click **Run** (or press Ctrl+Enter)

Wait for "Query successful" — it creates all 10 tables, indexes, triggers, and RLS policies.

## Step 2: Create the logos storage bucket

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `logos`
4. Check: **Public bucket** ✅
5. Click **Create bucket**

## Step 3: Configure Razorpay webhook (optional but recommended)

1. Go to https://dashboard.razorpay.com/app/webhooks
2. Add webhook URL: `https://sendquote.in/api/webhook`
3. Select events: `payment.captured`, `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.expired`
4. Copy the webhook signing secret
5. Update `RAZORPAY_WEBHOOK_SECRET` in `.env.local`

## Step 4: Update site URL for production

In `.env.local`, update:
```
NEXT_PUBLIC_SITE_URL=https://sendquote.in
```

## Tables created:
- `profiles` — user business info (name, logo, GST, address)
- `quotes` — all quote data with client info and totals
- `quote_items` — line items for each quote
- `quote_events` — open tracking events
- `subscriptions` — Razorpay subscription records
- `invoices` — converted invoices
- `invoice_items` — line items for invoices

All tables have Row Level Security (RLS) enabled — users can only see their own data.