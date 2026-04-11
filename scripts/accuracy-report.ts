// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

/**
 * Generate an accuracy report comparing our validator output
 * against expected results from validator.schema.org.
 * Usage: npx tsx scripts/accuracy-report.ts
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMarkup } from '../src/validate/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, '..', 'tests', 'accuracy', 'fixtures');

interface ExpectedResult {
  isValid: boolean;
  entities: { types: string[]; format: string; errors: unknown[]; warnings: unknown[] }[];
  errorCount: number;
  warningCount: number;
}

interface FixtureResult {
  name: string;
  pass: boolean;
  details: string[];
}

function getFixtures(): string[] {
  return readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => f.replace('.html', ''));
}

function runFixture(name: string): FixtureResult {
  const html = readFileSync(join(FIXTURES_DIR, `${name}.html`), 'utf-8');
  const expected: ExpectedResult = JSON.parse(
    readFileSync(join(FIXTURES_DIR, `${name}.expected.json`), 'utf-8'),
  );
  const actual = validateMarkup(html);

  const details: string[] = [];
  let pass = true;

  if (actual.isValid !== expected.isValid) {
    pass = false;
    details.push(`isValid: expected=${expected.isValid}, got=${actual.isValid}`);
  }

  if (actual.entities.length !== expected.entities.length) {
    pass = false;
    details.push(`entities: expected=${expected.entities.length}, got=${actual.entities.length}`);
  }

  if (actual.summary.errorCount !== expected.errorCount) {
    pass = false;
    details.push(`errors: expected=${expected.errorCount}, got=${actual.summary.errorCount}`);
  }

  if (actual.summary.warningCount !== expected.warningCount) {
    pass = false;
    details.push(`warnings: expected=${expected.warningCount}, got=${actual.summary.warningCount}`);
  }

  return { name, pass, details };
}

function main() {
  const fixtures = getFixtures();
  const results = fixtures.map(runFixture);
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const accuracy = ((passed / results.length) * 100).toFixed(1);

  console.log('\n=== Accuracy Report ===\n');
  for (const result of results) {
    const icon = result.pass ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    for (const detail of result.details) {
      console.log(`   ${detail}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Accuracy: ${accuracy}%\n`);

  // Write JSON report
  const report = {
    timestamp: new Date().toISOString(),
    total: results.length,
    passed,
    failed,
    overall: parseFloat(accuracy),
    results: results.map(r => ({
      name: r.name,
      pass: r.pass,
      details: r.details,
    })),
  };
  writeFileSync('accuracy-report.json', JSON.stringify(report, null, 2));
  console.log('Report written to accuracy-report.json');
}

main();
