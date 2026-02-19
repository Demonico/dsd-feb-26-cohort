import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL is not set in environment variables")
if not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_ANON_KEY is not set in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

if SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
else:
    supabase_admin = None

