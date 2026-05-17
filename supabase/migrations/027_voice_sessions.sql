-- Migration 027: Voice sessions for persistent chat memory
-- Enables cross-session voice assistant conversations

create table if not exists voice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  messages jsonb not null default '[]'::jsonb,
  context jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast session lookup by user
create index idx_voice_sessions_user_updated on voice_sessions(user_id, updated_at desc);

-- RLS policies
alter table voice_sessions enable row level security;

create policy "Users can view own voice sessions"
  on voice_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own voice sessions"
  on voice_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own voice sessions"
  on voice_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own voice sessions"
  on voice_sessions for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_voice_session_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_voice_session_updated_at
  before update on voice_sessions
  for each row
  execute function update_voice_session_updated_at();
