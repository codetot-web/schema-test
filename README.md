<p align="center">
  <img src="https://img.icons8.com/color/96/json--v1.png" alt="schemacraft-validator" width="96" height="96" />
</p>

<h1 align="center">schemacraft-validator</h1>

<p align="center">
  <strong>Schema.org structured data validator — accuracy-matched to <a href="https://validator.schema.org">validator.schema.org</a></strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/schemacraft-validator"><img src="https://img.shields.io/npm/v/schemacraft-validator?style=flat-square&color=cb3837" alt="npm version" /></a>
  <a href="https://github.com/Elbradey8/schemacraft-validator/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/Elbradey8/schemacraft-validator/ci.yml?style=flat-square&label=CI" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/schemacraft-validator"><img src="https://img.shields.io/npm/dm/schemacraft-validator?style=flat-square&color=blue" alt="downloads" /></a>
  <a href="https://github.com/Elbradey8/schemacraft-validator/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/schemacraft-validator?style=flat-square" alt="license" /></a>
  <a href="https://github.com/Elbradey8/schemacraft-validator"><img src="https://img.shields.io/github/stars/Elbradey8/schemacraft-validator?style=flat-square" alt="stars" /></a>
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/coverage-88%25-brightgreen?style=flat-square" alt="coverage" />
  <img src="https://img.shields.io/badge/accuracy-100%25-brightgreen?style=flat-square" alt="accuracy" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square&logo=node.js&logoColor=white" alt="node" />
</p>

<p align="center">
  <a href="#installation">Installation</a> &nbsp;&bull;&nbsp;
  <a href="#quick-start">Quick Start</a> &nbsp;&bull;&nbsp;
  <a href="#cli">CLI</a> &nbsp;&bull;&nbsp;
  <a href="#server">Server</a> &nbsp;&bull;&nbsp;
  <a href="#api-reference">API</a> &nbsp;&bull;&nbsp;
  <a href="#accuracy">Accuracy</a> &nbsp;&bull;&nbsp;
  <a href="#contributing">Contributing</a>
</p>

---

## Why schemacraft-validator?

The [Schema Markup Validator](https://validator.schema.org) (formerly Google's Structured Data Testing Tool) is the industry standard for validating Schema.org markup. SEOs, developers, and tools reference its output as ground truth.

**schemacraft-validator** brings that same validation to your codebase — as a library, CLI tool, or self-hostable server. No more manual copy-pasting into a web form.

- **Accuracy-matched** — tested against the real validator with real-world schemas; error counts match exactly
- **All 3 formats** — JSON-LD, Microdata, and RDFa extraction from HTML
- **Raw JSON-LD support** — paste the same JSON-LD you'd use on validator.schema.org
- **Full Schema.org vocabulary** — 1003 types, 1676 properties, complete type hierarchy with inheritance
- **@id cross-references** — resolves `{"@id": "..."}` within `@graph` structures
- **SDTT-compatible heuristics** — text-for-entity tolerance, URL coercion, string-to-number/boolean
- **Three interfaces** — Library API, CLI, and Express server

## Installation

```bash
npm install schemacraft-validator
```

**Optional**: For JavaScript rendering support (SPAs, dynamically injected JSON-LD):
```bash
npm install puppeteer
```

## Quick Start

### Library

```typescript
import { validate, validateMarkup, validateJsonLd } from 'schemacraft-validator';

// Validate a URL
const result = await validate('https://example.com');

// Validate raw HTML
const result = validateMarkup(`
  <html><head>
    <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Product","name":"Widget"}
    </script>
  </head><body></body></html>
`);

// Validate raw JSON-LD (string or object) — no HTML needed
const result = validateJsonLd({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Widget Pro",
  "offers": {
    "@type": "Offer",
    "price": "29.99",
    "priceCurrency": "USD"
  }
});

console.log(result.isValid);           // true
console.log(result.summary.types);     // ["Product"]
console.log(result.errors);            // []
console.log(result.warnings);          // []
```

### Batch Validation

```typescript
import { validateBatch } from 'schemacraft-validator';

const results = await validateBatch([
  'https://example.com/page1',
  'https://example.com/page2',
  'https://example.com/page3',
]);

for (const result of results) {
  console.log(`${result.url}: ${result.isValid ? 'VALID' : 'INVALID'}`);
}
```

## CLI

```bash
# Validate a URL
npx schemacraft-validator check https://example.com

# Validate a local HTML file
npx schemacraft-validator check ./page.html

# Validate raw JSON-LD (no HTML wrapper needed)
npx schemacraft-validator check-json ./schema.json

# JSON output (for piping / scripting)
npx schemacraft-validator check https://example.com --format json

# With JavaScript rendering (requires puppeteer)
npx schemacraft-validator check https://spa-example.com --render-js

# Custom timeout
npx schemacraft-validator check https://slow-site.com --timeout 30000
```

### CLI Output Example

```
Schema Validation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

URL: https://example.com
Status: ✅ Valid (0 errors, 0 warnings)
Entities: 2 found (json-ld)

─── Product ──────────────────────────────────────────
  name                 "Widget Pro"
  description          "The best widget ever made"
  offers               → Offer
    price              "29.99"
    priceCurrency      "USD"

─── Organization ─────────────────────────────────────
  name                 "Example Corp"
  url                  "https://example.com"
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Valid — zero errors |
| `1` | Invalid — has errors |
| `2` | Runtime error (fetch failed, file not found, etc.) |

## Server

Start a self-hostable validation server:

```bash
# Start on port 3001
npx schemacraft-validator serve --port 3001

# With secret-based auth (for sidecar deployments)
npx schemacraft-validator serve --port 3001 --secret my-secret-key
```

### Endpoints

#### `POST /validate`

```bash
# Validate a URL
curl -X POST http://localhost:3001/validate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Validate raw HTML
curl -X POST http://localhost:3001/validate \
  -H "Content-Type: application/json" \
  -d '{"markup": "<html>...</html>"}'

# Validate raw JSON-LD
curl -X POST http://localhost:3001/validate \
  -H "Content-Type: application/json" \
  -d '{"jsonld": {"@context":"https://schema.org","@type":"Product","name":"Test"}}'
```

#### `POST /validate/batch`

```bash
curl -X POST http://localhost:3001/validate/batch \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://example.com/a", "https://example.com/b"]}'
```

Max 100 URLs per batch request.

#### `GET /health`

```bash
curl http://localhost:3001/health
# {"status":"ok","version":"1.0.0","uptime":12345}
```

## API Reference

### Functions

| Function | Input | Returns | Description |
|----------|-------|---------|-------------|
| `validate(url, options?)` | URL string | `Promise<ValidationResult>` | Fetch URL and validate |
| `validateMarkup(html, options?)` | HTML string | `ValidationResult` | Validate raw HTML |
| `validateJsonLd(input, options?)` | JSON string or object | `ValidationResult` | Validate raw JSON-LD |
| `validateBatch(urls, options?)` | URL array | `Promise<ValidationResult[]>` | Validate multiple URLs |

### Options

```typescript
interface ValidateOptions {
  formats?: ('json-ld' | 'microdata' | 'rdfa')[];  // Default: all three
  followRedirects?: boolean;                         // Default: true
  renderJavascript?: boolean;                        // Default: false (needs puppeteer)
  timeout?: number;                                  // Default: 10000ms
  includeRaw?: boolean;                              // Default: false
  headers?: Record<string, string>;                  // Custom HTTP headers
  proxy?: string;                                    // HTTP proxy URL
  userAgent?: string;                                // Default: "SchemaCraftValidator/x.x.x"
}
```

### ValidationResult

```typescript
interface ValidationResult {
  url?: string;                    // URL validated (undefined for markup/jsonld input)
  timestamp: string;               // ISO 8601 timestamp
  duration: number;                // Processing time in ms
  isValid: boolean;                // true if zero errors (warnings don't count)
  entities: ValidatedEntity[];     // Detected Schema.org entities
  errors: ValidationIssue[];      // All errors
  warnings: ValidationIssue[];    // All warnings
  summary: {
    totalEntities: number;
    totalTriples: number;
    types: string[];               // e.g., ["Product", "Organization"]
    formats: ('json-ld' | 'microdata' | 'rdfa')[];
    errorCount: number;
    warningCount: number;
  };
}
```

### Issue Codes

| Code | Severity | Description |
|------|----------|-------------|
| `UNKNOWN_TYPE` | error | `@type` is not a recognized Schema.org type |
| `UNKNOWN_PROPERTY` | error | Property not valid for this type (matches SDTT `INVALID_PREDICATE`) |
| `INVALID_VALUE_TYPE` | error | Nested entity type doesn't match expected range (matches SDTT `INVALID_OBJECT`) |
| `MALFORMED_JSONLD` | error | Invalid JSON in script block |
| `MISSING_TYPE` | error | Missing `@type` on entity |
| `FETCH_ERROR` | error | HTTP fetch failed |
| `DEPRECATED_TYPE` | warning | Type is deprecated in Schema.org |
| `DEPRECATED_PROPERTY` | warning | Property is deprecated |
| `EMPTY_VALUE` | warning | Property value is empty string |

For the full API reference, see [docs/API.md](docs/API.md).

## Accuracy

### How We Test

Every release is tested against [validator.schema.org](https://validator.schema.org) to ensure our output matches. We maintain:

- **22 accuracy fixtures** covering JSON-LD, Microdata, RDFa, @graph, @id references, nested entities, mixed formats, edge cases
- **Real-world validation** against production schemas (e.g., ProxyScrape with 19 entities and @id cross-references — matched SDTT's 5 errors / 0 warnings exactly)
- **Weekly automated accuracy checks** via GitHub Actions

### Current Accuracy

| Metric | Value |
|--------|-------|
| Fixture accuracy | **100%** (22/22) |
| Test coverage | **88.77%** |
| Total tests | **203** |

### What We Check (same as validator.schema.org)

- Is `@type` a recognized Schema.org type?
- Is each property valid for that type (including inherited from parent types)?
- Does each property value match the expected type range?
- `@id` cross-references resolved within `@graph`
- Text-for-entity heuristic (tolerated, per SDTT behavior)
- Multiple types, nested entities, deprecated types/properties

### Known Divergences

We track every known difference in [DIVERGENCES.md](DIVERGENCES.md). Current divergences:

| # | Behavior | Status |
|---|----------|--------|
| 1 | JS rendering requires `--render-js` flag | By design |
| 2 | Entity grouping differs from SDTT display | By design |

## Supported Formats

| Format | Extraction | Validation | Notes |
|--------|-----------|------------|-------|
| **JSON-LD** | `<script type="application/ld+json">` | Full | @graph, @id refs, multiple blocks, BOM handling |
| **Microdata** | `itemscope`/`itemtype`/`itemprop` | Full | Nested entities, link/img/meta values |
| **RDFa** | `typeof`/`property`/`vocab` | Full | Quad grouping, nested entities |
| **Raw JSON-LD** | Direct input (no HTML) | Full | Same as pasting into validator.schema.org |

## Schema.org Vocabulary

The validator ships with a vendored copy of the [Schema.org vocabulary](https://schema.org/version/latest/schemaorg-current-https.jsonld) containing:

- **1003 types** with full class hierarchy
- **1676 properties** with domain/range definitions
- **Transitive subtype checking** (e.g., `LocalBusiness` is valid where `Organization` or `Place` is expected)
- **Property inheritance** (e.g., `Product` inherits all `Thing` properties)

The vocabulary is updated automatically via a weekly GitHub Action that checks for new Schema.org releases.

## Use Cases

- **SEO auditing** — validate Schema.org markup before deploying pages
- **CI/CD pipelines** — add schema validation to your build process
- **Content management** — validate markup generated by CMS plugins
- **API services** — self-host a validation endpoint for your platform
- **Development** — catch schema errors during development, not after indexing

## Docker / Sidecar

Run as a sidecar service alongside your application:

```dockerfile
FROM node:20-alpine
RUN npm install -g schemacraft-validator
EXPOSE 3001
CMD ["schemacraft-validator", "serve", "--port", "3001"]
```

```yaml
# docker-compose.yml
services:
  validator:
    image: node:20-alpine
    command: npx schemacraft-validator serve --port 3001 --secret ${VALIDATOR_SECRET}
    ports:
      - "3001:3001"
```

## Requirements

- **Node.js** >= 18
- **puppeteer** (optional) — only needed for `--render-js` JavaScript rendering

## Attribution

This project is a fork of [Google's Schemarama](https://github.com/google/schemarama), originally licensed under the Apache License 2.0.

Schema.org vocabulary data is provided by [Schema.org](https://schema.org) under the [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) license.

This project is not affiliated with, endorsed by, or sponsored by Google or Schema.org.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
git clone https://github.com/Elbradey8/schemacraft-validator.git
cd schemacraft-validator
npm install
npm test          # 203 tests
npm run typecheck # TypeScript strict mode
npm run build     # CJS + ESM + DTS
```

## License

[Apache License 2.0](LICENSE) — see [NOTICE](NOTICE) for attribution details.

---

<p align="center">
  Built by <a href="https://github.com/Elbradey8">Abdullah Elbradey</a> &nbsp;&bull;&nbsp;
  <a href="https://schemacraft.net">schemacraft.net</a>
</p>
