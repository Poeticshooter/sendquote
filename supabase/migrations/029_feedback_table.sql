-- Migration 029: Feedback table for user feedback collection
-- Enables users to send feedback, visible in admin dashboard

create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  message text not null,
  rating integer check (rating >= 1 and rating <= 5),
  category text not null check (category in ('bug', 'feature', 'ui', 'other')),
  page text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index idx_feedback_user on feedback(user_id, created_at desc);
create index idx_feedback_category on feedback(category);
create index idx_feedback_rating on feedback(rating);
create index idx_feedback_created on feedback(created_at desc);

-- RLS policies
alter table feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can insert feedback"
  on feedback for insert
  with check (auth.uid() = user_id);

-- Users can view their own feedback
create policy "Users can view own feedback"
  on feedback for select
  using (auth.uid() = user_id);

-- Admins can view all feedback
create policy "Admins can view all feedback"
  on feedback for select
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.plan = 'admin'
    )
  );
