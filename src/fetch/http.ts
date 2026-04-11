// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import type { ValidateOptions } from '../types.js';
import { IssueCode } from '../types.js';

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_USER_AGENT = 'SchemaCraftValidator/1.0.0';

/**
 * Fetch HTML content from a URL using undici/fetch.
 */
export async function fetchUrl(url: string, options?: ValidateOptions): Promise<string> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  const userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...options?.headers,
    };

    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: options?.followRedirects === false ? 'manual' : 'follow',
    });

    if (!response.ok) {
      throw Object.assign(
        new Error(`HTTP ${response.status}: ${response.statusText}`),
        { code: IssueCode.FETCH_ERROR },
      );
    }

    return await response.text();
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw Object.assign(
        new Error(`Fetch timeout after ${timeout}ms: ${url}`),
        { code: IssueCode.FETCH_ERROR },
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
