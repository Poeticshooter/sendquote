-- Gamification, Referrals, Templates, and Follow-up Sequences
-- Run this in Supabase SQL Editor

-- 1. ACHIEVEMENTS
create table if not exists public.achievement_definitions (
  key text primary key,
  label text not null,
  description text not null,
  icon text not null,
  category text not null check (category in ('milestone', 'engagement', 'social')),
  threshold int
);

insert into public.achievement_definitions (key, label, description, icon, category, threshold) values
  ('first_quote', 'First Quote', 'Created your first quote', '📄', 'milestone', 1),
  ('ten_quotes', 'Getting Started', 'Created 10 quotes', '📊', 'milestone', 10),
  ('fifty_quotes', 'Quote Machine', 'Created 50 quotes', '🚀', 'milestone', 50),
  ('first_accepted', 'First Win', 'Got your first quote accepted', '🏆', 'milestone', 1),
  ('five_accepted', 'Rising Star', 'Got 5 quotes accepted', '⭐', 'milestone', 5),
  ('twenty_accepted', 'Deal Closer', 'Got 20 quotes accepted', '💎', 'milestone', 20),
  ('first_payment', 'Paid!', 'Received your first online payment', '💰', 'milestone', 1),
  ('high_win_rate', 'Sharpshooter', 'Maintain 75%+ win rate (min 10 quotes)', '🎯', 'engagement', 75),
  ('first_client', 'Networker', 'Added your first client', '👥', 'milestone', 1),
  ('ten_clients', 'People Person', 'Added 10 clients', '🤝', 'milestone', 10),
  ('streak_7', 'Weekly Warrior', 'Sent quotes 7 days in a row', '🔥', 'engagement', 7),
  ('streak_30', 'Unstoppable', 'Sent quotes 30 days in a row', '💪', 'engagement', 30),
  ('team_player', 'Team Player', 'Invited a team member', '👨‍👩‍👧‍👦', 'social', 1),
  ('referral_starter', 'Referral Star', 'Referred a friend who joined', '🌟', 'social', 1);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement text not null references achievement_definitions(key),
  unlocked_at timestamptz not null default now(),
  metadata jsonb,
  unique(user_id, achievement)
);

-- Enable RLS
alter table public.user_achievements enable row level security;
create policy "Users can read own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

create policy "System can insert achievements"
  on public.user_achievements for insert
  with check (true);

-- 2. REFERRALS
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_email text,
  referred_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'joined', 'converted', 'rewarded')),
  reward_months int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;
create policy "Users can read own referrals"
  on public.referrals for select
  using (auth.uid() = referrer_id);

create policy "Users can create referrals"
  on public.referrals for insert
  with check (auth.uid() = referrer_id);

-- 3. QUOTE TEMPLATES
create table if not exists public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  industry text not null,
  suggested_items jsonb not null default '[]',
  suggested_terms text,
  suggested_payment_terms text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.quote_templates (name, description, industry, suggested_items, suggested_terms, suggested_payment_terms, is_default) values
  (
    'Web Development',
    'Website and web app development projects',
    'technology',
    '[{"description": "Website Development (5 pages)", "quantity": 1, "rate": 50000, "unit": "project"}, {"description": "Domain & Hosting Setup", "quantity": 1, "rate": 5000, "unit": "project"}, {"description": "SEO Optimization", "quantity": 1, "rate": 15000, "unit": "project"}, {"description": "Monthly Maintenance", "quantity": 1, "rate": 5000, "unit": "month"}]',
    'Payment due within 30 days. 50% advance required for new clients.',
    '50% advance, 50% on completion',
    true
  ),
  (
    'Consulting Services',
    'Business and management consulting',
    'consulting',
    '[{"description": "Initial Consultation", "quantity": 1, "rate": 0, "unit": "session"}, {"description": "Strategy Development", "quantity": 40, "rate": 3000, "unit": "hour"}, {"description": "Implementation Support", "quantity": 20, "rate": 2500, "unit": "hour"}, {"description": "Monthly Retainer", "quantity": 1, "rate": 50000, "unit": "month"}]',
    'Cancellation requires 7 days notice. Expenses billed separately.',
    'Net 30',
    true
  ),
  (
    'Graphic Design',
    'Logo, branding, and design projects',
    'design',
    '[{"description": "Logo Design (3 concepts)", "quantity": 1, "rate": 15000, "unit": "project"}, {"description": "Brand Guidelines", "quantity": 1, "rate": 25000, "unit": "project"}, {"description": "Social Media Kit", "quantity": 1, "rate": 10000, "unit": "set"}, {"description": "Business Card Design", "quantity": 1, "rate": 3000, "unit": "design"}]',
    'Up to 2 rounds of revisions included. Additional revisions charged at ₹1,000/hr.',
    '50% advance, 50% on delivery',
    true
  ),
  (
    'IT Support',
    'Managed IT services and support',
    'technology',
    '[{"description": "IT Setup & Configuration", "quantity": 1, "rate": 10000, "unit": "project"}, {"description": "Monthly Support (up to 10 hrs)", "quantity": 1, "rate": 8000, "unit": "month"}, {"description": "Emergency Support (per incident)", "quantity": 1, "rate": 2000, "unit": "incident"}, {"description": "Cloud Backup Setup", "quantity": 1, "rate": 5000, "unit": "project"}]',
    'Support hours: Mon-Fri 9am-6pm. Emergency support has 2hr response time.',
    'Net 15',
    true
  ),
  (
    'Content Writing',
    'Blog posts, articles, and copywriting',
    'marketing',
    '[{"description": "Blog Post (1000-1500 words)", "quantity": 1, "rate": 5000, "unit": "post"}, {"description": "SEO Keyword Research", "quantity": 1, "rate": 3000, "unit": "project"}, {"description": "Social Media Copy (5 posts)", "quantity": 1, "rate": 5000, "unit": "set"}, {"description": "Newsletter Copy", "quantity": 1, "rate": 3000, "unit": "issue"}]',
    '2 rounds of revisions included. Additional revisions charged at ₹500/hr.',
    '100% upfront for new clients',
    true
  );

alter table public.quote_templates enable row level security;
create policy "Anyone can read templates"
  on public.quote_templates for select
  using (true);

-- 4. FOLLOW-UP SEQUENCES
create table if not exists public.followup_sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  trigger_days int[] not null default '{1,3,7}',
  trigger_condition text not null default 'sent' check (trigger_condition in ('sent', 'opened_no_response', 'expiring_soon', 'expired')),
  subject_template text not null,
  body_template text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.followup_schedule (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  sequence_id uuid not null references public.followup_sequences(id) on delete cascade,
  step int not null default 1,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled'))
);

alter table public.followup_sequences enable row level security;
create policy "Users can manage own sequences"
  on public.followup_sequences for all
  using (auth.uid() = user_id);

alter table public.followup_schedule enable row level security;
create policy "Users can read own schedule"
  on public.followup_schedule for select
  using (exists (select 1 from public.quotes where id = quote_id and user_id = auth.uid()));

-- 5. HEALTH SCORE is computed on-the-fly, no table needed

-- Indexes
create index if not exists idx_user_achievements_user on public.user_achievements(user_id);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);
create index if not exists idx_followup_schedule_status on public.followup_schedule(status);
create index if not exists idx_followup_schedule_date on public.followup_schedule(scheduled_at);
