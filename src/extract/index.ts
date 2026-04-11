// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import type { ExtractedBlock, SchemaFormat, ValidationIssue } from '../types.js';
import { extractJsonLd } from './jsonld.js';
import { extractMicrodata } from './microdata.js';
import { extractRdfa } from './rdfa.js';

export interface ExtractionResult {
  blocks: ExtractedBlock[];
  errors: ValidationIssue[];
}

/**
 * Run all extractors on the HTML and combine results.
 */
export function extractAll(html: string, formats?: SchemaFormat[]): ExtractionResult {
  const enabledFormats = formats ?? ['json-ld', 'microdata', 'rdfa'];
  const allBlocks: ExtractedBlock[] = [];
  const allErrors: ValidationIssue[] = [];

  if (enabledFormats.includes('json-ld')) {
    const result = extractJsonLd(html);
    allBlocks.push(...result.blocks);
    allErrors.push(...result.errors);
  }

  if (enabledFormats.includes('microdata')) {
    const result = extractMicrodata(html);
    allBlocks.push(...result.blocks);
  }

  if (enabledFormats.includes('rdfa')) {
    const result = extractRdfa(html);
    allBlocks.push(...result.blocks);
  }

  return { blocks: allBlocks, errors: allErrors };
}
