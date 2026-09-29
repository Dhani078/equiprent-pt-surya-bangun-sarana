import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const B = 'https://equiprent-pt-surya-bangun-sarana.dhanisepeda.workers.dev';
const TABS = [
  ['dashboard', null],
  ['equipment', 'Inventaris'],
  ['rentals', 'Transaksi'],
  ['maintenance', 'Perawatan'],
  ['tracking', 'GPS'],
  ['contracts', 'Kontrak'],
  ['reports', 'Laporan'],
];

const results = [];
const browser = await chromium.launch();
try {
  for (const [w, vh] of [[375, 812], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: vh }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36' });
    const page = await ctx.newPage();
    await page.goto(B, { waitUntil: 'load', timeout: 60000 });
    // login
    await page.waitForSelector('input[autocomplete="username"], input[name="username"], input[type="text"]', { timeout: 30000 });
    const u = page.locator('input').first();
    const p = page.locator('input[type="password"]').first();
    await u.fill('admin');
    await p.fill('admin');
    await page.getByRole('button', { name: /masuk|login|sign/i }).first().click();
    await page.waitForFunction(() => document.querySelector('h2') && location.hash !== '#/login' && !document.querySelector('input[type="password"]'), null, { timeout: 45000 }).catch(() => {});
    // sidebar nav via aria-label/title teks; fallback: klik link/menu by text
    for (const [key, label] of TABS) {
      try {
        if (label) {
          const nav = page.locator(`nav >> text=${label}`).first();
          if (await nav.count().catch(() => 0)) await nav.click({ timeout: 8000 });
          else await page.locator(`[aria-label*="${label}" i], a:has-text("${label}"), button:has-text("${label}")`).first().click({ timeout: 8000 });
        }
        await page.waitForTimeout(1800);
        const m = await page.evaluate(() => {
          const de = document.documentElement;
          const overflow = de.scrollWidth - de.clientWidth;
          const small = [];
          for (const el of document.querySelectorAll('button, a[role="button"], input[type="submit"], [role="switch"], [role="checkbox"], select')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.height < 44 && r.width < 44) small.push(`${el.tagName.toLowerCase()}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label').slice(0,28)}]` : ''} ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          return { overflow, title: (document.querySelector('h2')?.textContent ?? '').slice(0, 40), smallCount: small.length, small: small.slice(0, 8) };
        });
        results.push({ viewport: `${w}x${vh}`, tab: key, ...m });
      } catch (e) {
        results.push({ viewport: `${w}x${vh}`, tab: key, error: String(e).slice(0, 100) });
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
writeFileSync('STATE/_cdp_audit_89.json', JSON.stringify(results, null, 1));
for (const r of results) console.log(r.viewport, r.tab, 'overflow=' + r.overflow, 'small<44=' + r.smallCount, r.error ?? '');
