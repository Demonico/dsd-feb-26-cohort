# Use bash for predictable behavior
set shell := ["bash", "-cu"]

# Default recipe: just
default:
    @just --list

# ---- SETUP ----

setup:
    @echo "🔧 Setting up backend..."
    cd api && uv sync
    @echo "🔧 Setting up frontend..."
    cd frontend && npm install
    @echo "✅ Setup complete"

# ---- DEV ----

dev:
    @echo "🚀 Starting backend and frontend..."
    just api & just frontend && wait

backend:
    cd backend && uv run uvicorn api.main:app --reload

frontend:
    cd frontend && npm run dev

# ---- TESTING ----

test:
    @echo "🧪 Running tests..."
    cd api && uv run pytest
    cd frontend && npm test

# ---- LINTING ----

lint:
    cd api && uv run ruff check .
    cd frontend && npm run lint

format:
    cd api && uv run ruff format .
    cd frontend && npm run format

# ---- CLEANUP ----

clean:
    rm -rf api/.venv
    rm -rf frontend/node_modules
    @echo "🧹 Cleaned virtualenvs and node_modules"