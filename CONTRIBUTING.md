# Contributing to schemacraft-validator

Thank you for your interest in contributing to schemacraft-validator!

## Getting Started

```bash
git clone https://github.com/Elbradey8/schemacraft-validator.git
cd schemacraft-validator
npm install
npm test
```

## Development Workflow

1. Fork the repo and create a branch from `develop` (not `main`)
2. Follow the branching strategy in [BRANCHING.md](BRANCHING.md)
3. Write tests for your changes
4. Run the full test suite: `npm test`
5. Run type checking: `npm run typecheck`
6. Submit a PR to `develop`

## Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `docs/description` — documentation
- `test/description` — test additions
- `chore/description` — maintenance

## Commit Messages

Use [conventional commits](https://www.conventionalcommits.org/):

```
feat: add JSON-LD extractor with @graph support
fix: handle malformed JSON gracefully in extraction
test: add accuracy fixtures for nested entities
docs: document text-for-entity heuristic
chore: update Schema.org vocabulary to v28.1
refactor: simplify type hierarchy lookup
```

## Testing

- **Unit tests:** `tests/unit/` — test individual modules
- **Integration tests:** `tests/integration/` — test full pipeline
- **Accuracy tests:** `tests/accuracy/` — compare against validator.schema.org

Run specific test suites:
```bash
npm test                    # all tests
npm run test:accuracy       # accuracy tests only
npm run test:coverage       # with coverage report
```

### Adding Accuracy Fixtures

1. Create `tests/accuracy/fixtures/{name}.html` with the HTML input
2. Create `tests/accuracy/fixtures/{name}.expected.json` with expected output
3. Run `npm run test:accuracy` to verify

The expected JSON format:
```json
{
  "isValid": true,
  "entities": [
    {
      "types": ["Product"],
      "format": "json-ld",
      "errors": [],
      "warnings": []
    }
  ],
  "errorCount": 0,
  "warningCount": 0
}
```

## Reporting Divergences

If you find a case where our output differs from [validator.schema.org](https://validator.schema.org):

1. Open an issue with:
   - The HTML input
   - Our output (`--format json`)
   - Screenshot of validator.schema.org's output
2. Add the case to `DIVERGENCES.md`

## Code Style

- TypeScript strict mode — no `any` in public APIs
- Immutable patterns — prefer new objects over mutation
- Small functions (<50 lines), small files (<800 lines)
- Handle errors explicitly, never swallow them

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
