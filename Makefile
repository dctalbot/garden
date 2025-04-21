.PHONY: lint
lint: ## Run static analysis checks
	npx prettier . --write
	git diff --exit-code

.PHONY: start
start: ## Start a dev server
	npm i
	npm run dev

.PHONY: start-prod
start-prod: ## Start a preview server of the production build
	rm -rf dist;
	npm run astro build;
	npm run astro preview;

.PHONY: compress-images
compress-images: ## Reduce image sizes
	find src -type f -name "*.png" -exec pngquant -f -Q 100 --nofs -o {} {} \;

.PHONY: help
help:
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
