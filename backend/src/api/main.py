from fastapi import FastAPI
from api.routes.health import router

app = FastAPI()

@app.get("/") # todo: remove me
def root():
    return {"message": "API running"}

app.include_router(router)