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
        -- user_settings voice_sample_url
        create table if not exists user_settings (
          user_id uuid primary key references auth.users,
          theme text default 'dark',
          voice_sample_url text,
          created_at timestamptz default now()
        );

        alter table user_settings enable row level security;

        drop policy if exists "Users can view own settings" on user_settings;
        create policy "Users can view own settings"
          on user_settings for select
          using (auth.uid() = user_id);

        drop policy if exists "Users can manage own settings" on user_settings;
        create policy "Users can manage own settings"
          on user_settings for all
          using (auth.uid() = user_id);

        alter table user_settings add column if not exists voice_sample_url text;

        -- voice_clones table
        create table if not exists voice_clones (
          id uuid primary key default gen_random_uuid(),
          project_id uuid references projects on delete cascade not null,
          language text not null,
          sarvam_voice_id text,
          status text default 'not_started',
          consent_given_at timestamptz,
          ready_audio_url text,
          created_at timestamptz default now()
        );

        alter table voice_clones enable row level security;

        drop policy if exists "Users can view own clones" on voice_clones;
        create policy "Users can view own clones"
          on voice_clones for select
          using (
            project_id in (
              select id from projects where user_id = auth.uid()
            )
          );

        drop policy if exists "Users can create own clones" on voice_clones;
        create policy "Users can create own clones"
          on voice_clones for insert
          with check (
            project_id in (
              select id from projects where user_id = auth.uid()
            )
          );

        drop policy if exists "Users can update own clones" on voice_clones;
        create policy "Users can update own clones"
          on voice_clones for update
          using (
            project_id in (
              select id from projects where user_id = auth.uid()
            )
          );
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
