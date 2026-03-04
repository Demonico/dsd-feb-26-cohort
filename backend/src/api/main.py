from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth.router import router as auth_router
from .routes.distance import route as distance_router
from .routes.drivers import router as drivers_router
from .routes.customers import router as customers_router
from .routes.garbage_routes import router as garbage_routes_router
from .routes.customer_requests import router as customer_requests_router
from .routes.health import router as health_router
from .routes.service_jobs import router as service_jobs_router
from .routes.pullserviceloc import router as pullserviceloc_router
from .routes.uploads import router as uploads_router
from .routes.planning import router as planning_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(distance_router)
app.include_router(auth_router)
app.include_router(drivers_router)
app.include_router(customers_router)
app.include_router(garbage_routes_router)
app.include_router(customer_requests_router)

app.include_router(service_jobs_router)
app.include_router(pullserviceloc_router)
app.include_router(uploads_router)
app.include_router(planning_router)
