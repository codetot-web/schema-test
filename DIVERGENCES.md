# Known Divergences from validator.schema.org

This document tracks every known difference between schemacraft-validator
and the official Schema Markup Validator at validator.schema.org.

Our target is 98%+ accuracy. Where we diverge, it is documented here
with the reason and whether we plan to fix it.

## Format

| # | Behavior | validator.schema.org | schemacraft-validator | Status |
|---|----------|---------------------|----------------------|--------|
| 1 | JavaScript rendering | Renders JS by default | Requires `--render-js` flag and puppeteer | By design |
| 2 | Unknown property severity | `INVALID_PREDICATE` as ERROR | `UNKNOWN_PROPERTY` as warning | Investigating |
| 3 | Entity grouping in output | Groups by root entity, nests referenced entities | Flat list from @graph, nested via @id resolution | By design |
| 4 | Duplicate error counting | 1 error per property-value pair | May count more when same entity referenced via @id from multiple parents | Will fix |

## Fixed in v1.1.0

| # | Behavior | What Changed |
|---|----------|-------------|
| F1 | @id cross-references | Now resolves `{"@id": "..."}` within @graph — was treating them as missing-type entities |
| F2 | Nested entity type checking | Now flags `INVALID_VALUE_TYPE` when nested entity type doesn't match `rangeIncludes` (e.g., `makesOffer` expects `Offer`, got `Product`) |

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
