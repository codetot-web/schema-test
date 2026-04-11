// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import type { ValidationResult } from '../types.js';

/**
 * Format a ValidationResult as a human-readable text report.
 */
export function formatAsText(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('Schema Validation Report');
  lines.push('━'.repeat(40));
  lines.push('');

  if (result.url) {
    lines.push(`URL: ${result.url}`);
  }

  const statusIcon = result.isValid ? '✅' : '❌';
  const statusLabel = result.isValid ? 'Valid' : 'Invalid';
  lines.push(`Status: ${statusIcon} ${statusLabel} (${result.summary.errorCount} errors, ${result.summary.warningCount} warnings)`);
  lines.push(`Entities: ${result.summary.totalEntities} found (${result.summary.formats.join(', ')})`);
  lines.push('');

  for (const entity of result.entities) {
    const typeLabel = entity.types.length > 0 ? entity.types.join(', ') : 'Unknown Type';
    lines.push(`─── ${typeLabel} ${'─'.repeat(Math.max(0, 50 - typeLabel.length))}`);

    for (const prop of entity.properties) {
      const valueStr = formatValue(prop.value);
      const hasIssue = prop.issues.length > 0;
      const icon = hasIssue ? '⚠️ ' : '  ';
      lines.push(`${icon}${prop.name.padEnd(20)} ${valueStr}`);

      for (const issue of prop.issues) {
        const issueIcon = issue.severity === 'error' ? '❌' : '⚠️';
        lines.push(`    ${issueIcon} ${issue.message}`);
      }
    }

    for (const err of entity.errors.filter(e => !e.property)) {
      lines.push(`  ❌ ${err.message}`);
    }
    for (const warn of entity.warnings.filter(w => !w.property)) {
      lines.push(`  ⚠️  ${warn.message}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null && 'types' in value) {
    const entity = value as { types: string[] };
    return `→ ${entity.types.join(', ')}`;
  }
  return String(value);
}
