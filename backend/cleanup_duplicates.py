import os
from supabase import create_client
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

def cleanup():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    if not supabase_url or not supabase_key:
        print("Missing Supabase credentials")
        return

    sb = create_client(supabase_url, supabase_key)

    print("Fetching all projects...")
    res = sb.table("projects").select("id").execute()
    if not res.data:
        print("No projects found.")
        return

    total_removed = 0

    for proj in res.data:
        p_id = proj["id"]
        # Fetch transcripts for project
        trans_res = sb.table("transcripts").select("*").eq("project_id", p_id).execute()
        transcripts = trans_res.data
        if not transcripts:
            continue
        
        # Group by language
        by_lang = {}
        for t in transcripts:
            by_lang.setdefault(t["language"], []).append(t)
            
        for lang, ts in by_lang.items():
            if len(ts) > 1:
                # Sort by created_at desc (keep newest)
                # created_at is an ISO string like '2026-07-31T01:54:19.497521+00:00'
                ts.sort(key=lambda x: x["created_at"], reverse=True)
                keep = ts[0]
                remove = ts[1:]
                
                print(f"Project {p_id} has {len(ts)} transcripts for '{lang}'. Keeping {keep['id']}.")
                for r in remove:
                    print(f"  Removing duplicate transcript {r['id']}")
                    sb.table("transcripts").delete().eq("id", r["id"]).execute()
                    total_removed += 1

    print(f"Cleanup complete. Total duplicate transcripts removed: {total_removed}")

if __name__ == "__main__":
    cleanup()
