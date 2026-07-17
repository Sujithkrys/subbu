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
        -- Add is_favorite and file_size_bytes to projects
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS file_size_bytes numeric DEFAULT 0;

        -- Create activity_log table
        CREATE TABLE IF NOT EXISTS activity_log (
            id uuid primary key default gen_random_uuid(),
            user_id uuid references auth.users not null,
            project_id uuid references projects on delete cascade,
            action text not null,
            details jsonb,
            created_at timestamptz default now()
        );

        -- Enable RLS for activity_log
        ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own activity log" ON activity_log;
        CREATE POLICY "Users can view own activity log"
            ON activity_log FOR SELECT
            USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert own activity log" ON activity_log;
        CREATE POLICY "Users can insert own activity log"
            ON activity_log FOR INSERT
            WITH CHECK (auth.uid() = user_id);
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
