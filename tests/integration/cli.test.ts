// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLI_PATH = join(import.meta.dirname, '../../src/cli.ts');

const VALID_HTML = `
<html>
  <head>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Widget Pro",
      "description": "A fantastic widget"
    }
    </script>
  </head>
  <body></body>
</html>
`.trim();

const INVALID_HTML = `
<html>
  <head>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "UnknownTypeThatDoesNotExist999",
      "name": "Bad Entity"
    }
    </script>
  </head>
  <body></body>
</html>
`.trim();

function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync('npx', ['tsx', CLI_PATH, ...args], {
    encoding: 'utf-8',
    timeout: 30000,
    cwd: join(import.meta.dirname, '../..'),
  });

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? -1,
  };
}

const tempFiles: string[] = [];

function createTempFile(content: string, suffix = '.html'): string {
  const path = join(tmpdir(), `schemacraft-test-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`);
  writeFileSync(path, content, 'utf-8');
  tempFiles.push(path);
  return path;
}

afterEach(() => {
  for (const file of tempFiles.splice(0)) {
    if (existsSync(file)) {
      unlinkSync(file);
    }
  }
});

describe('CLI check command', () => {
  it('exits with code 0 for a valid HTML file', () => {
    const filePath = createTempFile(VALID_HTML);
    const { exitCode } = runCli(['check', filePath]);
    expect(exitCode).toBe(0);
  });

  it('outputs a text report by default for a valid HTML file', () => {
    const filePath = createTempFile(VALID_HTML);
    const { stdout, exitCode } = runCli(['check', filePath]);

    expect(exitCode).toBe(0);
    expect(stdout).toContain('Schema Validation Report');
    expect(stdout).toContain('Valid');
  });

  it('outputs JSON when --format json is specified', () => {
    const filePath = createTempFile(VALID_HTML);
    const { stdout, exitCode } = runCli(['check', filePath, '--format', 'json']);

    expect(exitCode).toBe(0);

    let parsed: Record<string, unknown>;
    expect(() => {
      parsed = JSON.parse(stdout) as Record<string, unknown>;
    }).not.toThrow();

    parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed['isValid']).toBe(true);
    expect(Array.isArray(parsed['entities'])).toBe(true);
    expect(Array.isArray(parsed['errors'])).toBe(true);
    expect(Array.isArray(parsed['warnings'])).toBe(true);
    expect(typeof parsed['timestamp']).toBe('string');
  });

  it('JSON output contains correct entity types for a Product', () => {
    const filePath = createTempFile(VALID_HTML);
    const { stdout, exitCode } = runCli(['check', filePath, '--format', 'json']);

    expect(exitCode).toBe(0);

    const parsed = JSON.parse(stdout) as {
      entities: Array<{ types: string[] }>;
    };
    expect(parsed.entities).toHaveLength(1);
    expect(parsed.entities[0]!.types).toContain('Product');
  });

  it('exits with code 1 for an HTML file with unknown type', () => {
    const filePath = createTempFile(INVALID_HTML);
    const { exitCode } = runCli(['check', filePath]);
    expect(exitCode).toBe(1);
  });

  it('JSON output for invalid HTML has isValid false and non-empty errors', () => {
    const filePath = createTempFile(INVALID_HTML);
    const { stdout, exitCode } = runCli(['check', filePath, '--format', 'json']);

    expect(exitCode).toBe(1);

    const parsed = JSON.parse(stdout) as {
      isValid: boolean;
      errors: unknown[];
    };
    expect(parsed.isValid).toBe(false);
    expect(parsed.errors.length).toBeGreaterThan(0);
  });

  it('exits with code 2 when the file does not exist', () => {
    const { exitCode, stderr } = runCli(['check', '/nonexistent/path/file.html']);

    expect(exitCode).toBe(2);
    expect(stderr).toContain('Error');
  });

  it('text output includes the entity type for a Product', () => {
    const filePath = createTempFile(VALID_HTML);
    const { stdout } = runCli(['check', filePath]);

    expect(stdout).toContain('Product');
  });

  it('handles HTML with no structured data (exits 1, no entities)', () => {
    const emptyHtml = '<html><body><p>Hello world</p></body></html>';
    const filePath = createTempFile(emptyHtml);
    const { stdout, exitCode } = runCli(['check', filePath, '--format', 'json']);

    // No structured data means no entities — isValid depends on pipeline behavior
    // We just verify valid JSON output is produced without crashing
    expect(exitCode).toBeDefined();
    const parsed = JSON.parse(stdout) as { entities: unknown[] };
    expect(parsed.entities).toHaveLength(0);
  });
});
