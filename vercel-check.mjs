import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const url = process.argv[2] || 'https://pixel-normal-edit.vercel.app/';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();

const errors = [];
const logs = [];
page.on('console', (msg) => {
  const type = msg.type();
  if (type === 'error' || type === 'warning') logs.push(`[${type}] ${msg.text()}`);
});
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
page.on('requestfailed', (req) => errors.push(`REQFAIL: ${req.url()} -> ${req.failure()?.errorText}`));

try {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 8000));
} catch (e) {
  errors.push(`NAVIGATION: ${e.message}`);
}

console.log('=== URL:', page.url());
console.log('=== TITLE:', await page.title());
console.log('=== ROOT HTML (first 300 chars):');
const html = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 300) || '(root empty)');
console.log(html);
console.log('=== PAGE ERRORS:');
console.log(errors.length ? errors.join('\n') : '(none)');
console.log('=== CONSOLE LOGS (error/warning):');
console.log(logs.length ? logs.join('\n') : '(none)');

await browser.close();
