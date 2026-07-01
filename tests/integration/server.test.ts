// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { describe, it, expect } from 'vitest';
import { createServer } from '../../src/server.js';
import http from 'node:http';

function request(
  server: http.Server,
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode!, body: data });
          }
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Server', () => {
  it('GET /health returns ok', async () => {
    const app = createServer();
    const server = app.listen(0);
    try {
      const res = await request(server, 'GET', '/health');
      expect(res.status).toBe(200);
      const body = res.body as { status: string; version: string };
      expect(body.status).toBe('ok');
      expect(body.version).toBe('1.0.0');
    } finally {
      server.close();
    }
  });

  it('POST /validate with markup validates HTML', async () => {
    const app = createServer();
    const server = app.listen(0);
    try {
      const html = '<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Test"}</script></head><body></body></html>';
      const res = await request(server, 'POST', '/validate', { markup: html });
      expect(res.status).toBe(200);
      const body = res.body as { isValid: boolean; entities: unknown[] };
      expect(body.isValid).toBe(true);
      expect(body.entities).toHaveLength(1);
    } finally {
      server.close();
    }
  });

  it('POST /validate requires url or markup', async () => {
    const app = createServer();
    const server = app.listen(0);
    try {
      const res = await request(server, 'POST', '/validate', {});
      expect(res.status).toBe(400);
    } finally {
      server.close();
    }
  });

  it('POST /validate/batch validates multiple markup strings', async () => {
    const app = createServer();
    const server = app.listen(0);
    try {
      const res = await request(server, 'POST', '/validate/batch', {});
      expect(res.status).toBe(400);
    } finally {
      server.close();
    }
  });

  it('rejects requests without bearer token when configured', async () => {
    const app = createServer({ bearerToken: 'test-token' });
    const server = app.listen(0);
    try {
      const res = await request(server, 'GET', '/health');
      expect(res.status).toBe(401);
    } finally {
      server.close();
    }
  });

  it('accepts requests with correct bearer token', async () => {
    const app = createServer({ bearerToken: 'test-token' });
    const server = app.listen(0);
    try {
      const res = await request(server, 'GET', '/health', undefined, {
        'Authorization': 'Bearer test-token',
      });
      expect(res.status).toBe(200);
    } finally {
      server.close();
    }
  });
});
