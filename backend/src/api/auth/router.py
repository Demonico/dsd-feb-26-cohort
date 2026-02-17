from fastapi import APIRouter, HTTPException, Query
from ..supabase_client import supabase
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/magic-link")
async def magicLink(email: str):
    try:
        response = supabase.auth.sign_in_with_otp({
            "email": email,
            "options": {
                "email_redirect_to": "https://localhost:3000/"
            }
        })
        return {"message": "Magic link sent to your email"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    pass


@router.get("/callback")
async def callback(token_hash: str, type: str):
    try:
        response = supabase.auth.sign_in_with_otp({
            "token_hash": token_hash,
            "type": magicLink
        })
        return {
            "access_token": response.session["access_token"],
            "refresh_token": response.session["refresh_token"],
            "user": response.user
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired magic link")
    pass