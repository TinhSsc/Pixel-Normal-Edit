import fs from 'fs';
import path from 'path';

const domain = 'https://pixel-normal-edit.vercel.app';
const langs = ['en', 'vi', 'id', 'ru', 'th'];
const tools = [
  { id: 'home', priority: '1.0' },
  { id: 'convert', priority: '0.8' },
  { id: 'compress', priority: '0.8' },
  { id: 'resize', priority: '0.8' },
  { id: 'crop', priority: '0.8' },
  { id: 'rotate', priority: '0.8' },
  { id: 'frames-to-media', priority: '0.8' },
  { id: 'media-to-frames', priority: '0.8' },
  { id: 'gif-simplify', priority: '0.8' }
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

for (const tool of tools) {
  for (const lang of langs) {
    const url = `${domain}/${lang}/${tool.id}`;
    xml += `  <url>\n`;
    xml += `    <loc>${url}</loc>\n`;
    
    // Add alternate links for all languages
    for (const altLang of langs) {
      xml += `    <xhtml:link rel="alternate" hreflang="${altLang}" href="${domain}/${altLang}/${tool.id}" />\n`;
    }
    // x-default is English
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/en/${tool.id}" />\n`;
    
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>${tool.priority}</priority>\n`;
    xml += `  </url>\n`;
  }
}

xml += `</urlset>\n`;

const sitemapPath = path.resolve('public/sitemap.xml');
fs.writeFileSync(sitemapPath, xml, 'utf8');

const distPath = path.resolve('dist');
if (fs.existsSync(distPath)) {
  fs.writeFileSync(path.join(distPath, 'sitemap.xml'), xml, 'utf8');
}
console.log('Successfully generated public/sitemap.xml & dist/sitemap.xml with localized routes!');

