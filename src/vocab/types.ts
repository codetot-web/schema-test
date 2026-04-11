// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import { getTypeMap, getSubtypeTree, getPropertyMap } from './loader.js';

const SCHEMA_IRI = 'https://schema.org/';
const SCHEMA_HTTP_IRI = 'http://schema.org/';

/** Strip Schema.org IRI prefix to get bare type name */
export function stripSchemaPrefix(name: string): string {
  if (name.startsWith(SCHEMA_IRI)) return name.slice(SCHEMA_IRI.length);
  if (name.startsWith(SCHEMA_HTTP_IRI)) return name.slice(SCHEMA_HTTP_IRI.length);
  if (name.startsWith('schema:')) return name.slice(7);
  return name;
}

/** Check if a type exists in the Schema.org vocabulary */
export function isKnownType(typeName: string): boolean {
  const bare = stripSchemaPrefix(typeName);
  return getTypeMap().has(bare);
}

/** Check if childType is a subtype of parentType (transitive) */
export function isSubTypeOf(childType: string, parentType: string): boolean {
  const child = stripSchemaPrefix(childType);
  const parent = stripSchemaPrefix(parentType);
  if (child === parent) return true;
  const ancestors = getSubtypeTree().get(child);
  return ancestors?.has(parent) ?? false;
}

/**
 * Return ALL valid properties for a type, INCLUDING inherited from ALL ancestor types.
 * For multiple types, returns the union of all properties.
 */
export function getValidProperties(typeNames: string[]): Set<string> {
  const allTypes = new Set<string>();
  for (const name of typeNames) {
    const bare = stripSchemaPrefix(name);
    allTypes.add(bare);
    const ancestors = getSubtypeTree().get(bare);
    if (ancestors) {
      for (const a of ancestors) allTypes.add(a);
    }
  }

  const validProps = new Set<string>();
  const propMap = getPropertyMap();
  for (const [propName, propDef] of propMap) {
    for (const domain of propDef.domainIncludes) {
      if (allTypes.has(domain)) {
        validProps.add(propName);
        break;
      }
    }
  }
  return validProps;
}

/** Return all ancestor types in the hierarchy up to Thing */
export function getAncestorTypes(typeName: string): string[] {
  const bare = stripSchemaPrefix(typeName);
  const ancestors = getSubtypeTree().get(bare);
  return ancestors ? [...ancestors] : [];
}

/** Check if type has supersededBy set */
export function isDeprecatedType(typeName: string): boolean {
  const bare = stripSchemaPrefix(typeName);
  const typeDef = getTypeMap().get(bare);
  return typeDef?.isDeprecated ?? false;
}

/** Get a type definition by name */
export function getTypeDef(typeName: string) {
  const bare = stripSchemaPrefix(typeName);
  return getTypeMap().get(bare);
}
