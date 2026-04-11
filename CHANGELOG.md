# Changelog

## 1.0.0 (Unreleased)

### Added
- Core validation pipeline: extract, parse, validate, format
- JSON-LD extraction with @graph support, multiple blocks, BOM handling
- Schema.org vocabulary loader with full type hierarchy
- Type checking (unknown type = error)
- Property checking (unknown/invalid property = warning)
- Value checking with SDTT-compatible heuristics
- Text-for-entity tolerance (matches SDTT behavior)
- CLI: `check` command with text/JSON output
- CLI: `serve` command for self-hostable validation server
- Express server with /validate, /validate/batch, /health endpoints
- 83+ unit and integration tests
- 7 accuracy test fixtures
- TypeScript definitions for all public APIs
