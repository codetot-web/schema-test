# API Reference

## Library API

### `validate(url, options?)`

Validate structured data from a URL.

```typescript
import { validate } from 'schemacraft-validator';

const result = await validate('https://example.com', {
  timeout: 15000,
  formats: ['json-ld'],
});
```

**Parameters:**
- `url` (string) — URL to fetch and validate
- `options` (ValidateOptions, optional) — see [Options](#options)

**Returns:** `Promise<ValidationResult>`

---

### `validateMarkup(html, options?)`

Validate structured data from raw HTML markup.

```typescript
import { validateMarkup } from 'schemacraft-validator';

const html = '<html>...</html>';
const result = validateMarkup(html);
```

**Parameters:**
- `html` (string) — HTML markup containing structured data
- `options` (ValidateOptions, optional) — see [Options](#options)

**Returns:** `ValidationResult`

---

### `validateBatch(urls, options?)`

Validate structured data from multiple URLs concurrently.

```typescript
import { validateBatch } from 'schemacraft-validator';

const results = await validateBatch([
  'https://example.com/page1',
  'https://example.com/page2',
], { timeout: 10000 });
```

**Parameters:**
- `urls` (string[]) — URLs to validate
- `options` (ValidateOptions, optional) — see [Options](#options)

**Returns:** `Promise<ValidationResult[]>`

---

## Options

```typescript
interface ValidateOptions {
  // Formats to extract. Default: all three
  formats?: ('json-ld' | 'microdata' | 'rdfa')[];

  // Follow HTTP redirects. Default: true
  followRedirects?: boolean;

  // Render JavaScript before extraction. Default: false
  // Requires puppeteer as peer dependency
  renderJavascript?: boolean;

  // Fetch timeout in ms. Default: 10000
  timeout?: number;

  // Include raw extracted markup in results. Default: false
  includeRaw?: boolean;

  // Custom HTTP headers for fetching
  headers?: Record<string, string>;

  // HTTP proxy URL (e.g., "http://proxy:8080")
  proxy?: string;

  // User-Agent string. Default: "SchemaCraftValidator/1.0.0"
  userAgent?: string;
}
```

---

## Result Types

### `ValidationResult`

```typescript
interface ValidationResult {
  url?: string;              // URL validated (undefined for markup input)
  timestamp: string;         // ISO 8601 timestamp
  duration: number;          // Processing time in ms
  isValid: boolean;          // true if zero errors (warnings don't count)
  entities: ValidatedEntity[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    totalEntities: number;
    totalTriples: number;
    types: string[];         // e.g., ["Product", "Organization"]
    formats: ('json-ld' | 'microdata' | 'rdfa')[];
    errorCount: number;
    warningCount: number;
  };
}
```

### `ValidatedEntity`

```typescript
interface ValidatedEntity {
  types: string[];           // e.g., ["Product"] or ["Restaurant", "BarOrPub"]
  format: 'json-ld' | 'microdata' | 'rdfa';
  id?: string;               // @id if present
  properties: ValidatedProperty[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  raw?: string;              // Raw markup (if includeRaw: true)
}
```

### `ValidatedProperty`

```typescript
interface ValidatedProperty {
  name: string;              // e.g., "name", "offers"
  value: PropertyValue;      // string | number | boolean | ValidatedEntity | array
  issues: ValidationIssue[];
}
```

### `ValidationIssue`

```typescript
interface ValidationIssue {
  severity: 'error' | 'warning';
  code: IssueCode;
  message: string;
  path?: string;             // e.g., "Product.offers.price"
  type?: string;
  property?: string;
}
```

### `IssueCode`

| Code | Severity | Description |
|------|----------|-------------|
| `UNKNOWN_TYPE` | error | @type is not a recognized Schema.org type |
| `MALFORMED_JSONLD` | error | Invalid JSON in script block |
| `MISSING_CONTEXT` | error | Missing @context |
| `MISSING_TYPE` | error | Missing @type |
| `INVALID_VALUE_TYPE` | error | Value type doesn't match expected |
| `INVALID_ENUM_VALUE` | error | Enumeration value not in allowed set |
| `FETCH_ERROR` | error | HTTP fetch failed |
| `UNKNOWN_PROPERTY` | warning | Property not defined for this type |
| `DEPRECATED_TYPE` | warning | Type is deprecated |
| `DEPRECATED_PROPERTY` | warning | Property is deprecated |
| `EMPTY_VALUE` | warning | Property value is empty |
| `TEXT_FOR_ENTITY` | warning | Text where entity expected (tolerated) |

---

## Server API

### `POST /validate`

```json
// Request
{
  "url": "https://example.com",
  "options": { "timeout": 15000 }
}
// OR
{
  "markup": "<html>...</html>",
  "options": {}
}

// Response: ValidationResult
```

### `POST /validate/batch`

```json
// Request
{
  "urls": ["https://example.com/a", "https://example.com/b"],
  "options": {}
}

// Response: ValidationResult[]
```

Max 100 URLs per batch.

### `GET /health`

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345
}
```

### Authentication

Use `--secret` flag to require `X-Internal-Secret` header:

```bash
schemacraft-validator serve --port 3001 --secret mysecret
```

```bash
curl -H "X-Internal-Secret: mysecret" http://localhost:3001/health
```

---

## CLI

```bash
# Validate a URL
schemacraft-validator check https://example.com

# Validate a local file
schemacraft-validator check ./page.html

# JSON output
schemacraft-validator check https://example.com --format json

# With JavaScript rendering
schemacraft-validator check https://example.com --render-js

# Custom timeout
schemacraft-validator check https://example.com --timeout 15000

# Start server
schemacraft-validator serve --port 3001
schemacraft-validator serve --port 3001 --secret mysecret
```

**Exit codes:**
- `0` — valid (zero errors)
- `1` — invalid (has errors)
- `2` — runtime error (fetch failed, file not found, etc.)
