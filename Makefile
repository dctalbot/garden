.PHONY: lint
lint: ## Run static analysis checks
	npx prettier . --write
	git diff --exit-code

.PHONY: start
start: ## Start a dev server
	npm i
	npm run dev

.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	