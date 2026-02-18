from fastapi import FastAPI
from api.routes.health import router
from api.routes import drivers

app = FastAPI()

@app.get("/") # todo: remove me
def root():
    return {"message": "API running"}

app.include_router(router)
app.include_router(drivers.router)