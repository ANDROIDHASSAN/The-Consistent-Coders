import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../../config/env.js';
import { hideEmails, isExpired } from '../jobs/job.service.js';
import { categoryBySlug, categoryOf, cityOf, isPlaceholder, jobHeadline, jobSummary, skillSlug, slugify } from '../../../frontend/src/content/jobCategories.js';
import { hasFullDescription, jobPostingSchema } from '../../../frontend/src/content/jobSchema.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(here, '../../../frontend/dist');

// `<` must be escaped inside <script> so user text can never close the tag.
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

export const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** The built SPA shell for /jobs (prerendered at build). Falls back to fetching it from the live site. */
export const loadShell = async () => {
    try {
        return await readFile(path.join(distDir, 'jobs', 'index.html'), 'utf8');
    }
    catch {
        const response = await fetch(`${env.siteUrl}/jobs/index.html`);
        if (!response.ok) throw new Error('Could not load SPA shell for job page.');
        return response.text();
    }
};

/** Strip the shell's own SEO tags so the injected ones are the only copies. */
const stripSeoTags = (html) => html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>/gi, '')
    .replace(/<meta\s+name="robots"[^>]*>/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>/gi, '')
    .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, '')
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '');

const dateTag = (d) => `<time datetime="${new Date(d).toISOString().slice(0, 10)}">${new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</time>`;

/** Build the crawler-ready HTML for one job page. `related` are open jobs in the same category, linked for crawl depth. */
export const renderJobPage = (shell, rawJob, related = []) => {
    // Crawlers get the guest view: contact emails are for signed-in members only.
    const job = { ...rawJob, description: hideEmails(rawJob.description), applyUrl: /^mailto:/i.test(rawJob.applyUrl ?? '') ? '' : rawJob.applyUrl };
    const url = `${env.siteUrl}/jobs/${job.slug}`;
    const title = `${jobHeadline(job)} | The Consistent Coders`;
    const description = jobSummary(job);
    const closed = job.status !== 'open' || isExpired(job);
    const cat = categoryBySlug(job.category || categoryOf(job));
    const catPath = `/jobs/category/${cat.slug}`;

    const breadcrumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: env.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Jobs', item: `${env.siteUrl}/jobs` },
            { '@type': 'ListItem', position: 3, name: cat.name, item: `${env.siteUrl}${catPath}` },
            { '@type': 'ListItem', position: 4, name: job.title, item: url },
        ],
    };

    const company = companyLink(job.company);
    const city = cityOf(job.location);
    // Plain semantic content for crawlers that don't run JS. React replaces it on load.
    const body = `
    <main class="prerender-job">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/jobs">Jobs</a> › <a href="${catPath}">${escapeHtml(cat.name)}</a> › <span>${escapeHtml(job.title)}</span></nav>
      <h1>${escapeHtml(job.title)}</h1>
      <p>${escapeHtml(jobHeadline(job))}</p>
      <h2>Job details</h2>
      <dl>
        <dt>Company</dt><dd>${company}</dd>
        <dt>Job type</dt><dd>${escapeHtml(job.type)}</dd>
        <dt>Work mode</dt><dd>${escapeHtml(job.workMode)}</dd>
        <dt>Experience</dt><dd>${escapeHtml(job.experience)}</dd>
        <dt>Location</dt><dd>${city ? `<a href="/jobs/in/${city.slug}">${escapeHtml(job.location)}</a>` : escapeHtml(job.location)}</dd>
        ${job.salary ? `<dt>Salary</dt><dd>${escapeHtml(job.salary)}</dd>` : ''}
        <dt>Posted</dt><dd>${dateTag(job.createdAt)}</dd>
        ${job.deadline ? `<dt>Apply by</dt><dd>${dateTag(job.deadline)}</dd>` : ''}
        ${job.skills?.length ? `<dt>Skills</dt><dd>${job.skills.filter(skillSlug).map((s) => `<a href="/jobs/skill/${skillSlug(s)}">${escapeHtml(s)}</a>`).join(', ')}</dd>` : ''}
      </dl>
      <h2>About this role</h2>
      ${job.description.split(/\n+/).map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
      <p><a href="${escapeHtml(job.applyUrl || `/jobs/${job.slug}#apply`)}"${job.applyUrl ? ' rel="nofollow noopener"' : ''}>Apply for ${escapeHtml(job.title)}</a></p>
      ${related.length ? `<h2>Similar jobs</h2>
      <ul>${related.map((r) => `<li><a href="/jobs/${r.slug}">${escapeHtml(jobHeadline(r))}</a></li>`).join('')}</ul>` : ''}
      <p>More: <a href="${catPath}">${escapeHtml(cat.name)} jobs</a>${city ? ` · <a href="/jobs/in/${city.slug}">Jobs in ${escapeHtml(city.name)}</a>` : ''}${isPlaceholder(job.company) ? '' : ` · <a href="/jobs/company/${slugify(job.company)}">All ${escapeHtml(job.company)} jobs</a>`}</p>
    </main>`;

    return injectPage(shell, {
        title, description, url, type: 'article', noindex: closed,
        jsonLd: closed || !hasFullDescription(job) ? [breadcrumbs] : [jobPostingSchema(job, env.siteUrl, 'The Consistent Coders'), breadcrumbs],
        body,
    });
};

const companyLink = (name) => (isPlaceholder(name) ? escapeHtml(name) :`<a href="/jobs/company/${slugify(name)}">${escapeHtml(name)}</a>`);

/** Writes head tags and the crawler body into the SPA shell. */
const injectPage = (shell, { title, description, url, type = 'website', noindex = false, jsonLd, body }) => {
    const head = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="The Consistent Coders" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${env.siteUrl}/og-default.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${env.siteUrl}/og-default.png" />
    ${jsonLd.map((o) => `<script type="application/ld+json">${safeJson(o)}</script>`).join('\n    ')}
    `;
    return stripSeoTags(shell)
        .replace('</head>', `${head}</head>`)
        // #root is closed by the last </div> before a body script or </body> (Vite puts its scripts in <head>).
        .replace(/<div id="root">[\s\S]*?<\/div>(?=\s*(?:<script|<\/body>))/, () => `<div id="root">${body}</div>`);
};

/**
 * Crawler HTML for a programmatic list page: /jobs/company/:slug or /jobs/in/:slug.
 * `heading` is the h1 and the title, e.g. "Honeywell Aerospace Jobs & Internships for Freshers 2026". Empty pages are noindex (thin content).
 */
export const renderListPage = (shell, { path: pagePath, heading, crumb, description, jobs, siblings = [], faq = [], noindex = jobs.length === 0 }) => {
    const url = `${env.siteUrl}${pagePath}`;
    const title = `${heading} | The Consistent Coders`;
    const crumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: env.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Jobs', item: `${env.siteUrl}/jobs` },
            { '@type': 'ListItem', position: 3, name: crumb, item: url },
        ],
    };
    const list = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: heading,
        numberOfItems: jobs.length,
        itemListElement: jobs.map((j, i) => ({ '@type': 'ListItem', position: i + 1, url: `${env.siteUrl}/jobs/${j.slug}`, name: j.title })),
    };
    const body = `
    <main class="prerender-job">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/jobs">Jobs</a> › <span>${escapeHtml(crumb)}</span></nav>
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(description)}</p>
      <ul>${jobs.map((j) => `<li><a href="/jobs/${j.slug}">${escapeHtml(j.title)}</a> · ${companyLink(j.company)} · ${escapeHtml(j.type)} · ${escapeHtml(j.location)}${j.salary ? ` · ${escapeHtml(j.salary)}` : ''}</li>`).join('')}</ul>
      ${siblings.length ? `<p>Also see: ${siblings.map((s) => `<a href="${s.path}">${escapeHtml(s.name)}</a>`).join(' · ')}</p>` : ''}
      ${faq.length ? `<h2>${escapeHtml(crumb)} hiring: FAQs</h2>
      ${faq.map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('')}` : ''}
    </main>`;
    // No FAQPage markup: Google retired FAQ rich results in May 2026, and auto-built Q&A markup across many pages reads as scaled content.
    return injectPage(shell, { title, description, url, noindex, jsonLd: [list, crumbs], body });
};

/**
 * Google reads <lastmod> only while it stays truthful, so a page gets one only when we know its real last change
 * (its newest job, a blog post's date). changefreq and priority are left out: Google ignores both.
 */
export const buildSitemap = ({ staticRoutes, blogSlugs, jobs, listPages = [] }) => {
    const entry = (loc, lastmod) => `  <url><loc>${env.siteUrl}${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}</url>`;
    const urls = [
        ...staticRoutes.map((r) => entry(r.path, r.lastmod)),
        ...listPages.map((p) => entry(p.path, p.lastmod)),
        ...blogSlugs.map((b) => entry(`/blog/${b.slug}`, b.updatedAt)),
        ...jobs.map((j) => entry(`/jobs/${j.slug}`, j.updatedAt)),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
};
