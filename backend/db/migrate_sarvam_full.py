import os
import sys
import psycopg2

def run_migration():
    conn_str = "postgresql://postgres:Svastrino%40123@db.giuuxqgwxfhrdnwzhenm.supabase.co:5432/postgres"
    print("Connecting to Supabase PostgreSQL database...")
    try:
        conn = psycopg2.connect(conn_str)
        cursor = conn.cursor()
        
        sql = """
        -- 2.1 voice_samples
        create table if not exists voice_samples (
          id uuid primary key default gen_random_uuid(),
          user_id uuid references auth.users not null,
          storage_url text not null,       -- R2 URL
          duration_seconds numeric,
          label text default 'My voice',   -- lets a user save more than one sample later if needed
          created_at timestamptz default now()
        );

        alter table voice_samples enable row level security;
        drop policy if exists "owner only" on voice_samples;
        create policy "owner only" on voice_samples
          for all using (auth.uid() = user_id);

        -- 2.2 voice_clones
        drop table if exists voice_clones cascade;

        create table voice_clones (
          id uuid primary key default gen_random_uuid(),
          project_id uuid references projects not null,
          voice_sample_id uuid references voice_samples not null,
          language text not null,               -- e.g. 'hi', 'te', 'ta' — Sarvam's language codes
          sarvam_voice_id text,                 -- returned by Sarvam once cloning succeeds
          status text default 'not_started',    -- not_started | consent_given | processing | ready | failed
          consent_given_at timestamptz,         -- REQUIRED before status can move past 'consent_given' — audit trail, do not make optional
          ready_audio_url text,                 -- R2 URL of the generated dubbed audio, once ready
          error_message text,
          created_at timestamptz default now(),
          updated_at timestamptz default now(),
          unique (project_id, language)
        );

        alter table voice_clones enable row level security;
        drop policy if exists "owner only via project" on voice_clones;
        create policy "owner only via project" on voice_clones
          for all using (
            exists (select 1 from projects where projects.id = voice_clones.project_id and projects.user_id = auth.uid())
          );

        -- 2.4 Extend usage table
        alter table usage add column if not exists voice_cloning_seconds_used numeric default 0;
        alter table usage add column if not exists sarvam_stt_seconds_used numeric default 0;
        """
        
        print("Executing migration SQL...")
        cursor.execute(sql)
        conn.commit()
        print("Migration completed successfully!")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error during migration: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
