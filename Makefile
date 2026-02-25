.PHONY: dev-web dev-api migrate migrate-down seed install-web install-api

# Frontend
dev-web:
	cd apps/web && npm run dev

install-web:
	cd apps/web && npm install

# Backend
dev-api:
	cd packages/api && uvicorn main:app --reload --port 8000

install-api:
	pip install -r packages/api/requirements.txt

# Database
migrate:
	cd packages/db && alembic upgrade head

migrate-down:
	cd packages/db && alembic downgrade -1

migrate-generate:
	cd packages/db && alembic revision --autogenerate -m "$(MSG)"

seed:
	cd packages/db && python seed.py

# Both at once (requires tmux or two terminals — just a helper)
dev:
	@echo "Run 'make dev-api' in one terminal and 'make dev-web' in another."
