.PHONY: help test test-cov lint format typecheck build clean install dev release-patch release-minor release-major

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

test:  ## Run tests
	pnpm test

test-cov:  ## Run tests with coverage
	pnpm test:coverage

lint:  ## Run linting
	pnpm lint

format:  ## Format code (if you have prettier)
	pnpm format || echo "Add 'format' script to package.json to enable formatting"

typecheck:  ## Run type checking
	pnpm typecheck

build:  ## Build the project
	pnpm build

clean:  ## Clean build artifacts and dependencies
	rm -rf dist/ build/ node_modules/.cache/
	find . -name "*.tsbuildinfo" -delete

install:  ## Install dependencies
	pnpm install

dev:  ## Run in development mode
	pnpm dev || echo "Add 'dev' script to package.json to enable dev mode"

release-patch:  ## Release patch version (1.0.0 -> 1.0.1)
	./release.sh patch

release-minor:  ## Release minor version (1.0.0 -> 1.1.0)
	./release.sh minor

release-major:  ## Release major version (1.0.0 -> 2.0.0)
	./release.sh major

ci:  ## Run full CI pipeline (lint, typecheck, test, build)
	pnpm lint
	pnpm typecheck
	pnpm test
	pnpm build
	@echo "✅ All CI checks passed!"