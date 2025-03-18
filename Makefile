.PHONY: lint
lint:
	npx prettier . --write
	git diff --exit-code