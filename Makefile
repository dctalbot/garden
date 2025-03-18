.PHONY: lint
lint:
	npx prettier . --write
	git diff --exit-code

.PHONY: start
start:
	npm run dev
