# Known Divergences from validator.schema.org

This document tracks every known difference between schemacraft-validator
and the official Schema Markup Validator at validator.schema.org.

Our target is 98%+ accuracy. Where we diverge, it is documented here
with the reason and whether we plan to fix it.

## Format

| # | Behavior | validator.schema.org | schemacraft-validator | Status |
|---|----------|---------------------|----------------------|--------|
| 1 | JavaScript rendering | Renders JS by default | Requires `--render-js` flag and puppeteer | By design |
| 2 | Microdata extraction | Full support | Stub (not yet implemented) | Will fix |
| 3 | RDFa extraction | Full support | Stub (not yet implemented) | Will fix |

## Status Legend
- **By design** — intentional difference, documented
- **Investigating** — difference found, root cause unclear
- **Will fix** — difference confirmed, fix planned
- **Fixed in vX.X** — was different, now matches

## How to report a divergence

If you find a case where our validator produces different results
from validator.schema.org, please open an issue with:
1. The HTML or URL input
2. Our output (JSON from `--format json`)
3. A screenshot of validator.schema.org's output
