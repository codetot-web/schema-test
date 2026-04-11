// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import type { ExtractedBlock } from '../types.js';

export interface RdfaExtractionResult {
  blocks: ExtractedBlock[];
  errors: never[];
}

/**
 * Extract RDFa (typeof/property/vocab) from HTML.
 */
export function extractRdfa(html: string): RdfaExtractionResult {
  // Phase 2 implementation — RDFa extraction
  void html;
  return { blocks: [], errors: [] };
}
