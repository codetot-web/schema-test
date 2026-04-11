// Copyright 2026 Abdo Elbradey
// Licensed under the Apache License, Version 2.0

/**
 * Browser-based fetcher using Puppeteer (optional peer dependency).
 * Required for JavaScript rendering support.
 */
export async function fetchWithBrowser(url: string, timeout = 30000): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let puppeteer: any;
  try {
    // @ts-expect-error optional peer dependency
    puppeteer = await import('puppeteer');
  } catch {
    throw new Error(
      'puppeteer is required for JavaScript rendering. Install it: npm install puppeteer'
    );
  }

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout });
    return await page.content();
  } finally {
    await browser.close();
  }
}
