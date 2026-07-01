// Copyright 2026 Abdullah Elbradey
// Licensed under the Apache License, Version 2.0

import { Command } from 'commander';
import { validate, validateMarkup, validateJsonLd } from './validate/index.js';
import { formatAsText } from './format/index.js';
import { readFileSync } from 'node:fs';

const program = new Command();

program
  .name('schema-test')
  .description('Schema.org structured data validator — accuracy-matched to validator.schema.org')
  .version('1.0.0');

program
  .command('check')
  .description('Validate structured data from a URL or file')
  .argument('<target>', 'URL or file path to validate')
  .option('--format <type>', 'Output format: text or json', 'text')
  .option('--render-js', 'Render JavaScript before extraction (requires puppeteer)', false)
  .option('--timeout <ms>', 'Fetch timeout in milliseconds', '10000')
  .action(async (target: string, opts: { format: string; renderJs: boolean; timeout: string }) => {
    try {
      let result;

      if (target.startsWith('http://') || target.startsWith('https://')) {
        result = await validate(target, {
          renderJavascript: opts.renderJs,
          timeout: parseInt(opts.timeout, 10),
        });
      } else {
        const html = readFileSync(target, 'utf-8');
        result = validateMarkup(html);
      }

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      } else {
        process.stdout.write(formatAsText(result) + '\n');
      }

      process.exit(result.isValid ? 0 : 1);
    } catch (error) {
      process.stderr.write(`Error: ${(error as Error).message}\n`);
      process.exit(2);
    }
  });

program
  .command('check-json')
  .description('Validate raw JSON-LD (no HTML wrapper needed)')
  .argument('<file>', 'Path to a .json or .jsonld file containing JSON-LD')
  .option('--format <type>', 'Output format: text or json', 'text')
  .action((file: string, opts: { format: string }) => {
    try {
      const content = readFileSync(file, 'utf-8');
      const result = validateJsonLd(content);

      if (opts.format === 'json') {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      } else {
        process.stdout.write(formatAsText(result) + '\n');
      }

      process.exit(result.isValid ? 0 : 1);
    } catch (error) {
      process.stderr.write(`Error: ${(error as Error).message}\n`);
      process.exit(2);
    }
  });

program
  .command('serve')
  .description('Start the validation server')
  .option('--port <number>', 'Port to listen on', '3001')
  .option('--secret <key>', 'Require X-Internal-Secret header for authentication (default: VALIDATOR_SECRET env)')
  .option('--allowed-origins <origins>', 'CORS allowed origins (comma-separated, default: *)')
  .action(async (opts: { port: string; secret?: string; allowedOrigins?: string }) => {
    const { createServer } = await import('./server.js');
    const secret = opts.secret || process.env.VALIDATOR_SECRET;
    const allowedOrigins = opts.allowedOrigins
      ? opts.allowedOrigins.split(',').map(s => s.trim())
      : undefined;
    const server = createServer({ secret, allowedOrigins });
    const port = parseInt(opts.port, 10);
    server.listen(port, () => {
      process.stdout.write(`Schema.org Validator (schema-test) listening on http://0.0.0.0:${port}\n`);
      if (secret) process.stdout.write('🔒 Auth: X-Internal-Secret header required\n');
      process.stdout.write(`🌐 CORS: ${allowedOrigins ? allowedOrigins.join(', ') : '*'}\n`);
    });
  });

program.parse();
