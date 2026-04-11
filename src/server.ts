// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validate, validateMarkup, validateJsonLd, validateBatch } from './validate/index.js';
import type { ValidateOptions } from './types.js';

interface ServerOptions {
  secret?: string;
}

export function createServer(options?: ServerOptions) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Optional secret-based auth for sidecar deployment
  if (options?.secret) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const provided = req.headers['x-internal-secret'];
      if (provided !== options.secret) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      next();
    });
  }

  app.post('/validate', async (req: Request, res: Response) => {
    try {
      const { url, markup, jsonld, options: validateOpts } = req.body as {
        url?: string;
        markup?: string;
        jsonld?: string | Record<string, unknown>;
        options?: ValidateOptions;
      };

      if (!url && !markup && !jsonld) {
        res.status(400).json({ error: 'One of "url", "markup", or "jsonld" is required' });
        return;
      }

      const result = url
        ? await validate(url, validateOpts)
        : jsonld
          ? validateJsonLd(jsonld, validateOpts)
          : validateMarkup(markup!, validateOpts);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/validate/batch', async (req: Request, res: Response) => {
    try {
      const { urls, options: validateOpts } = req.body as {
        urls?: string[];
        options?: ValidateOptions;
      };

      if (!urls || !Array.isArray(urls)) {
        res.status(400).json({ error: '"urls" array is required' });
        return;
      }

      if (urls.length > 100) {
        res.status(400).json({ error: 'Maximum 100 URLs per batch request' });
        return;
      }

      const results = await validateBatch(urls, validateOpts);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      uptime: process.uptime(),
    });
  });

  return app;
}
