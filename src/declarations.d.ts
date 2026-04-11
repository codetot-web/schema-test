// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

declare module 'microdata-node' {
  interface MicrodataItem {
    type: string[];
    properties: Record<string, unknown[]>;
    id?: string;
  }
  interface MicrodataResult {
    items: MicrodataItem[];
  }
  function toJson(html: string): MicrodataResult;
  function toJsonld(html: string): unknown[];
  export { toJson, toJsonld };
}
