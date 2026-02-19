from fastapi import APIRouter, HTTPException, Query
from ..supabase_client import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/magic-link")
async def send_magic_link(email: str):
    try:
        redirect_url = f"http://localhost:8000/auth/callback"
        supabase.auth.sign_in_with_otp({
            "email": email,
            "options": {
                "email_redirect_to": redirect_url,
                "flow_type": "pkce"
            }
        })
        return {"message": "Magic link sent to your email"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/callback")
async def callback(email: str, token_hash: str, type: str = "magiclink"):
    try:
        response = supabase.auth.sign_in_with_otp({
            "email": email,
            "token_hash": token_hash,
            "type": type
        })

        session = response.session
        user = response.user

        return {
            "msg": "Successfully authenticated",
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": user.id,
            "email": user.email,
        }
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")