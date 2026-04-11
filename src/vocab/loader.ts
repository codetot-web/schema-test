// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SchemaType, SchemaProperty } from '../types.js';

const SCHEMA_PREFIX = 'schema:';
const SCHEMA_IRI = 'https://schema.org/';

interface VocabGraph {
  '@context': Record<string, string>;
  '@graph': VocabNode[];
}

interface VocabNode {
  '@id': string;
  '@type': string | string[];
  'rdfs:label'?: string;
  'rdfs:comment'?: string;
  'rdfs:subClassOf'?: RefOrRefs;
  'schema:domainIncludes'?: RefOrRefs;
  'schema:rangeIncludes'?: RefOrRefs;
  'schema:supersededBy'?: { '@id': string };
}

type RefOrRefs = { '@id': string } | { '@id': string }[];

let typeMap: Map<string, SchemaType> | undefined;
let propertyMap: Map<string, SchemaProperty> | undefined;
let subtypeTree: Map<string, Set<string>> | undefined;
let dataTypeSet: Set<string> | undefined;

function extractLabel(id: string): string {
  if (id.startsWith(SCHEMA_PREFIX)) return id.slice(SCHEMA_PREFIX.length);
  if (id.startsWith(SCHEMA_IRI)) return id.slice(SCHEMA_IRI.length);
  return id;
}

function toArray(ref: RefOrRefs | undefined): string[] {
  if (!ref) return [];
  if (Array.isArray(ref)) return ref.map(r => r['@id']);
  return [ref['@id']];
}

function isSchemaId(id: string): boolean {
  return id.startsWith(SCHEMA_PREFIX) || id.startsWith(SCHEMA_IRI);
}

function normalizeId(id: string): string {
  return extractLabel(id);
}

function hasType(node: VocabNode, type: string): boolean {
  if (Array.isArray(node['@type'])) return node['@type'].includes(type);
  return node['@type'] === type;
}

function getVocabDir(): string {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    // CJS fallback
    return __dirname;
  }
}

function loadVocabFile(): VocabGraph {
  const filePath = join(getVocabDir(), 'data', 'schemaorg-current-https.jsonld');
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as VocabGraph;
}

function buildMaps(): void {
  const vocab = loadVocabFile();
  const graph = vocab['@graph'];

  const types = new Map<string, SchemaType>();
  const properties = new Map<string, SchemaProperty>();
  const dataTypes = new Set<string>();

  // First pass: collect types and properties
  for (const node of graph) {
    if (!isSchemaId(node['@id'])) continue;

    const label = normalizeId(node['@id']);

    if (hasType(node, 'rdfs:Class')) {
      const parentRefs = toArray(node['rdfs:subClassOf']).filter(isSchemaId).map(normalizeId);
      types.set(label, {
        id: node['@id'],
        label,
        comment: (node['rdfs:comment'] as string) ?? '',
        subClassOf: parentRefs,
        isDeprecated: node['schema:supersededBy'] !== undefined,
        supersededBy: node['schema:supersededBy']?.['@id'],
      });
    }

    // DataType entries (some are both Class and DataType)
    if (hasType(node, 'schema:DataType') ||
        (Array.isArray(node['@type']) && node['@type'].includes('schema:DataType'))) {
      dataTypes.add(label);
    }

    if (hasType(node, 'rdf:Property')) {
      const domains = toArray(node['schema:domainIncludes']).filter(isSchemaId).map(normalizeId);
      const ranges = toArray(node['schema:rangeIncludes']).filter(isSchemaId).map(normalizeId);
      properties.set(label, {
        id: node['@id'],
        label,
        comment: (node['rdfs:comment'] as string) ?? '',
        domainIncludes: domains,
        rangeIncludes: ranges,
        isDeprecated: node['schema:supersededBy'] !== undefined,
        supersededBy: node['schema:supersededBy']?.['@id'],
      });
    }
  }

  // Always include core data types
  for (const dt of ['Text', 'Number', 'Integer', 'Float', 'Boolean', 'Date', 'DateTime', 'Time', 'URL']) {
    dataTypes.add(dt);
  }

  // Build subtype tree (transitive closure of ancestors)
  const ancestorCache = new Map<string, Set<string>>();

  function getAncestors(typeName: string): Set<string> {
    const cached = ancestorCache.get(typeName);
    if (cached) return cached;

    const ancestors = new Set<string>();
    const typeDef = types.get(typeName);
    if (typeDef) {
      for (const parent of typeDef.subClassOf) {
        ancestors.add(parent);
        for (const ancestor of getAncestors(parent)) {
          ancestors.add(ancestor);
        }
      }
    }
    ancestorCache.set(typeName, ancestors);
    return ancestors;
  }

  const tree = new Map<string, Set<string>>();
  for (const typeName of types.keys()) {
    tree.set(typeName, getAncestors(typeName));
  }

  typeMap = types;
  propertyMap = properties;
  subtypeTree = tree;
  dataTypeSet = dataTypes;
}

function ensureLoaded(): void {
  if (!typeMap) buildMaps();
}

export function getTypeMap(): Map<string, SchemaType> {
  ensureLoaded();
  return typeMap!;
}

export function getPropertyMap(): Map<string, SchemaProperty> {
  ensureLoaded();
  return propertyMap!;
}

export function getSubtypeTree(): Map<string, Set<string>> {
  ensureLoaded();
  return subtypeTree!;
}

export function getDataTypes(): Set<string> {
  ensureLoaded();
  return dataTypeSet!;
}

export function resetVocabCache(): void {
  typeMap = undefined;
  propertyMap = undefined;
  subtypeTree = undefined;
  dataTypeSet = undefined;
}
