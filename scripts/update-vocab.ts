// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

/**
 * Fetch the latest Schema.org vocabulary and update the vendored file.
 * Usage: npx tsx scripts/update-vocab.ts
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VOCAB_URL = 'https://schema.org/version/latest/schemaorg-current-https.jsonld';
const OUTPUT_PATH = join(__dirname, '..', 'src', 'vocab', 'data', 'schemaorg-current-https.jsonld');

async function main() {
  console.log(`Fetching Schema.org vocabulary from ${VOCAB_URL}...`);

  const response = await fetch(VOCAB_URL);
  if (!response.ok) {
    console.error(`Failed to fetch: HTTP ${response.status}`);
    process.exit(1);
  }

  const newContent = await response.text();

  // Validate it's valid JSON
  try {
    const parsed = JSON.parse(newContent);
    const graph = parsed['@graph'];
    if (!Array.isArray(graph)) {
      console.error('Invalid vocabulary: missing @graph array');
      process.exit(1);
    }
    console.log(`Vocabulary contains ${graph.length} entries`);
  } catch (e) {
    console.error(`Invalid JSON: ${(e as Error).message}`);
    process.exit(1);
  }

  // Compare with existing
  try {
    const existing = readFileSync(OUTPUT_PATH, 'utf-8');
    if (existing === newContent) {
      console.log('No changes detected. Vocabulary is up to date.');
      return;
    }
  } catch {
    // File doesn't exist yet
  }

  writeFileSync(OUTPUT_PATH, newContent, 'utf-8');
  console.log(`Updated vocabulary at ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
