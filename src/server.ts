// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import express from 'express';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import { validate, validateMarkup, validateJsonLd, validateBatch } from './validate/index.js';
import type { ValidateOptions } from './types.js';

interface ServerOptions {
  bearerToken?: string;
  allowedOrigins?: string[];
}

export function createServer(options?: ServerOptions) {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // CORS — allow specific origins or all in dev
  app.use(cors({
    origin: options?.allowedOrigins ?? '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Bearer token auth — only backend services can call
  if (options?.bearerToken) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header. Use: Bearer <token>' });
        return;
      }
      const token = authHeader.slice(7);
      if (token !== options.bearerToken) {
        res.status(401).json({ error: 'Invalid bearer token' });
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
