from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.router import router as auth_router
from api.routes.health import router
from api.routes.distance import route as distance_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/")  # todo: remove me
def root():
    return {"message": "API running"}


app.include_router(router)
app.include_router(distance_router)

