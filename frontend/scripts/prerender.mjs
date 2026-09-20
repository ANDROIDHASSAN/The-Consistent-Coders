// Build-time prerender: writes a static HTML file for every indexable route so
// crawlers get real content + per-page <head> tags without running JS.
// Run after `vite build` (client) and `vite build --ssr` (server bundle).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STATIC_ROUTES } from '../src/content/siteRoutes.js';
import { BLOG_POSTS } from '../src/content/blog/meta.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const template = await readFile(path.join(dist, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href);

// Keep an untouched SPA shell for client-only routes (/profile, unknown paths).
await writeFile(path.join(dist, '200.html'), template);

const routes = [
    ...STATIC_ROUTES.map((r) => r.path),
    ...BLOG_POSTS.map((p) => `/blog/${p.slug}`),
];

let count = 0;
for (const route of routes) {
    const { html, head } = render(route);
    const page = template
        .replace(/<title>[^<]*<\/title>\s*<!--app-head-->/, head)
        .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    const outDir = route === '/' ? dist : path.join(dist, route);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, 'index.html'), page);
    count += 1;
}
console.log(`prerendered ${count} routes`);
