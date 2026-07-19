-- Migration: Add user_settings table, presets, and review_state
-- Run this in your Supabase SQL Editor

-- 1. Create user_settings table
create table if not exists user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  theme text default 'dark'
);

-- Enable RLS for user_settings
alter table user_settings enable row level security;

create policy "Users can view own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);


-- 2. Add preset to subtitle_styles
alter table subtitle_styles
  add column if not exists preset text default 'minimal';


-- 3. Add review_state to transcripts
alter table transcripts
  add column if not exists review_state text default 'needs_review';

-- Update existing asr transcripts to be 'reviewed' automatically
update transcripts set review_state = 'reviewed' where source = 'asr';
