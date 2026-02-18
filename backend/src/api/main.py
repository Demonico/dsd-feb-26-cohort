from fastapi import FastAPI
from api.routes.health import router
from api.routes.distance import route as distance_router

app = FastAPI()

@app.get("/") # todo: remove me
def root():
    return {"message": "API running"}

app.include_router(router)
app.include_router(distance_router)