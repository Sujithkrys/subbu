-- ============================================
-- AI Subtitle Generator Platform
-- Supabase Database Schema
-- ============================================
-- Run this in the Supabase SQL editor to set up all tables and RLS policies.

-- ── Projects ────────────────────────────────────────────────────────────────

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,
  video_url text,
  duration_seconds numeric,
  status text default 'uploaded', -- uploaded, transcribing, translating, ready, failed
  created_at timestamptz default now()
);

alter table projects enable row level security;

create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);


-- ── Transcripts ─────────────────────────────────────────────────────────────

create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  language text not null,
  segments jsonb not null,        -- [{start, end, text}, ...]
  source text not null,            -- 'asr' or 'translated'
  created_at timestamptz default now()
);

alter table transcripts enable row level security;

create policy "Users can view own transcripts"
  on transcripts for select
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can create transcripts for own projects"
  on transcripts for insert
  with check (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );


-- ── Subtitle Styles ─────────────────────────────────────────────────────────

create table if not exists subtitle_styles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  font text,
  color text,
  position text,
  animation_type text,
  created_at timestamptz default now()
);

alter table subtitle_styles enable row level security;

create policy "Users can view own styles"
  on subtitle_styles for select
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can manage own styles"
  on subtitle_styles for all
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );


-- ── Exports ─────────────────────────────────────────────────────────────────

create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  format text not null,            -- srt, vtt, ass, burned_mp4
  url text,
  created_at timestamptz default now()
);

alter table exports enable row level security;

create policy "Users can view own exports"
  on exports for select
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can create exports for own projects"
  on exports for insert
  with check (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );


-- ── Jobs ────────────────────────────────────────────────────────────────────

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete cascade not null,
  type text not null,              -- transcribe, translate, render
  status text default 'queued',    -- queued, processing, done, failed
  progress numeric default 0,
  error text,
  created_at timestamptz default now()
);

alter table jobs enable row level security;

create policy "Users can view own jobs"
  on jobs for select
  using (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );

create policy "Users can create jobs for own projects"
  on jobs for insert
  with check (
    project_id in (
      select id from projects where user_id = auth.uid()
    )
  );
