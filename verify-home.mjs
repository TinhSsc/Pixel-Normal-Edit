import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));

// 1. Go to editor
await page.goto('https://pixel-normal-edit.vercel.app/editor', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 6000));
console.log('STEP 1 - editor loaded, URL:', page.url());
console.log('   last_visited_tool =', await page.evaluate(() => localStorage.getItem('last_visited_tool')));

// 2. Click the logo (img) to go home
const clicked = await page.evaluate(() => {
  const img = document.querySelector('.header img');
  if (img) { img.click(); return true; }
  return false;
});
console.log('STEP 2 - logo clicked:', clicked);
await new Promise((r) => setTimeout(r, 8000));

console.log('STEP 3 - after logo click, URL:', page.url());
const title = await page.title();
const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 200) || '(empty)');
console.log('   TITLE:', title);
console.log('   ROOT:', rootHtml);

console.log('=== PAGE ERRORS:');
console.log(errors.length ? errors.join('\n') : '(none)');

await browser.close();
