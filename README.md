# schemacraft-validator

Schema.org structured data validator — accuracy-matched to [validator.schema.org](https://validator.schema.org). Supports JSON-LD, Microdata, and RDFa.

## Features

- Validates JSON-LD, Microdata, and RDFa structured data
- Accuracy-matched to the Schema Markup Validator (validator.schema.org)
- Full Schema.org type hierarchy and property inheritance
- SDTT-compatible heuristics (text-for-entity, URL coercion, etc.)
- Library, CLI, and self-hostable server interfaces
- TypeScript-first with full type definitions

## Installation

```bash
npm install schemacraft-validator
```

## Usage

### Library

```typescript
import { validate, validateMarkup } from 'schemacraft-validator';

// Validate a URL
const result = await validate('https://example.com');

// Validate raw HTML
const result = validateMarkup('<html>...</html>');

console.log(result.isValid);      // true/false
console.log(result.entities);     // detected Schema.org entities
console.log(result.errors);       // validation errors
console.log(result.warnings);     // validation warnings
```

### CLI

```bash
# Validate a URL
npx schemacraft-validator check https://example.com

# Validate a local file
npx schemacraft-validator check ./page.html

# JSON output
npx schemacraft-validator check https://example.com --format json

# Start validation server
npx schemacraft-validator serve --port 3001
```

### Server

```bash
npx schemacraft-validator serve --port 3001

# Validate a URL
curl -X POST http://localhost:3001/validate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Validate raw HTML
curl -X POST http://localhost:3001/validate \
  -H "Content-Type: application/json" \
  -d '{"markup": "<html>...</html>"}'

# Health check
curl http://localhost:3001/health
```

## API

### `validate(url, options?)`

Validates structured data from a URL. Returns a `Promise<ValidationResult>`.

### `validateMarkup(html, options?)`

Validates structured data from raw HTML markup. Returns a `ValidationResult`.

### `validateBatch(urls, options?)`

Validates multiple URLs. Returns a `Promise<ValidationResult[]>`.

### Options

```typescript
interface ValidateOptions {
  formats?: ('json-ld' | 'microdata' | 'rdfa')[];
  followRedirects?: boolean;
  renderJavascript?: boolean;  // requires puppeteer
  timeout?: number;
  includeRaw?: boolean;
  headers?: Record<string, string>;
  proxy?: string;
  userAgent?: string;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  url?: string;
  timestamp: string;
  duration: number;
  isValid: boolean;
  entities: ValidatedEntity[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    totalEntities: number;
    totalTriples: number;
    types: string[];
    formats: ('json-ld' | 'microdata' | 'rdfa')[];
    errorCount: number;
    warningCount: number;
  };
}
```

## Accuracy

Our goal is 98%+ accuracy match against validator.schema.org. Known divergences are documented in [DIVERGENCES.md](DIVERGENCES.md).

## Attribution

This project is a fork of [Google's Schemarama](https://github.com/google/schemarama), originally licensed under the Apache License 2.0.

Schema.org vocabulary data is provided by [Schema.org](https://schema.org) under the [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) license.

This project is not affiliated with, endorsed by, or sponsored by Google or Schema.org.

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
