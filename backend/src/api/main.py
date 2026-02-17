from fastapi import FastAPI

from auth.router import router as auth_router
from api.routes.health import router

app = FastAPI()

app.include_router(auth_router)

@app.get("/") # todo: remove me
def root():
    return {"message": "API running"}

app.include_router(router)