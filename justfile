# Use bash for predictable behavior
set shell := ["bash", "-cu"]

# Default recipe: just
default:
    @just --list

# ---- SETUP ----

setup:
    @echo "🔧 Setting up backend..."
    cd backend && uv sync
    @echo "🔧 Setting up frontend..."
    cd frontend && pnpm install
    @echo "✅ Setup complete"

# ---- DEV ----

dev:
    @echo "🚀 Starting backend and frontend..."
    just backend & just frontend && wait

backend:
    cd backend && uv run uvicorn api.main:app --reload

frontend:
    cd frontend && pnpm run dev

# ---- TESTING ----

test:
    @echo "🧪 Running tests..."
    cd backend && uv run pytest
    cd frontend && pnpm test

# ---- LINTING ----

lint:
    cd backend && uv run ruff check .
    cd frontend && pnpm run lint

format:
    cd backend && uv run ruff format .
    cd frontend && pnpm run format

# ---- CLEANUP ----

clean:
    rm -rf api/.venv
    rm -rf frontend/node_modules
    @echo "🧹 Cleaned virtualenvs and node_modules"