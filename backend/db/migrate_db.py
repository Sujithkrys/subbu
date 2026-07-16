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
        -- Create usage table
        create table if not exists usage (
          id uuid primary key default gen_random_uuid(),
          user_id uuid references auth.users not null,
          month date not null,
          transcription_seconds_used numeric default 0,
          translation_characters_used numeric default 0,
          updated_at timestamptz default now()
        );

        -- Add unique constraint on (user_id, month) to prevent duplicate monthly rows
        alter table usage drop constraint if exists unique_user_month;
        alter table usage add constraint unique_user_month unique (user_id, month);

        -- Enable RLS
        alter table usage enable row level security;

        -- Policies
        drop policy if exists "Users can view own usage" on usage;
        create policy "Users can view own usage"
          on usage for select
          using (auth.uid() = user_id);
          
        drop policy if exists "Users can insert own usage" on usage;
        create policy "Users can insert own usage"
          on usage for insert
          with check (auth.uid() = user_id);

        drop policy if exists "Users can update own usage" on usage;
        create policy "Users can update own usage"
          on usage for update
          using (auth.uid() = user_id);
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
