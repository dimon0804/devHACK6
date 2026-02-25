.PHONY: up down build logs clean migrate

up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

clean:
	docker-compose down -v
	docker system prune -f

migrate-auth:
	cd backend/auth-service && alembic upgrade head

migrate-user:
	cd backend/user-service && alembic upgrade head

migrate-game:
	cd backend/game-service && alembic upgrade head

migrate-progress:
	cd backend/progress-service && alembic upgrade head

migrate-all: migrate-auth migrate-user migrate-game migrate-progress
