import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../../config/env.js';

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

const jobPostingSchema = (job, url) => {
    const employmentType = {
        'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', Internship: 'INTERN', Contract: 'CONTRACTOR', Freelance: 'CONTRACTOR',
    }[job.type] ?? 'OTHER';
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: `<p>${escapeHtml(job.description).replace(/\n+/g, '</p><p>')}</p>`,
        datePosted: new Date(job.createdAt).toISOString(),
        employmentType,
        hiringOrganization: {
            '@type': 'Organization',
            name: job.company,
            ...(job.companyUrl ? { sameAs: job.companyUrl } : {}),
        },
        jobLocation: {
            '@type': 'Place',
            address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'IN' },
        },
        directApply: !job.applyUrl,
        url,
        identifier: { '@type': 'PropertyValue', name: 'The Consistent Coders', value: job.slug },
    };
    if (job.workMode === 'Remote') {
        schema.jobLocationType = 'TELECOMMUTE';
        schema.applicantLocationRequirements = { '@type': 'Country', name: 'India' };
    }
    if (job.deadline) schema.validThrough = new Date(job.deadline).toISOString();
    if (job.skills?.length) schema.skills = job.skills.join(', ');
    if (job.salary) schema.baseSalary = { '@type': 'MonetaryAmount', currency: 'INR', value: { '@type': 'QuantitativeValue', value: job.salary } };
    return schema;
};

/** Build the crawler-ready HTML for one job page. */
export const renderJobPage = (shell, job) => {
    const url = `${env.siteUrl}/jobs/${job.slug}`;
    const title = `${job.title} at ${job.company} — ${job.type}, ${job.location} | The Consistent Coders`;
    const description = `${job.title} (${job.type}, ${job.workMode}) at ${job.company}, ${job.location}. ${job.salary ? `${job.salary}. ` : ''}${job.description.slice(0, 120).replace(/\s+\S*$/, '')}… Apply on The Consistent Coders.`;
    const closed = job.status !== 'open';

    const breadcrumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: env.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Jobs', item: `${env.siteUrl}/jobs` },
            { '@type': 'ListItem', position: 3, name: job.title, item: url },
        ],
    };

    const head = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${closed ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="The Consistent Coders" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${env.siteUrl}/og-default.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${env.siteUrl}/og-default.png" />
    ${closed ? '' : `<script type="application/ld+json">${safeJson(jobPostingSchema(job, url))}</script>`}
    <script type="application/ld+json">${safeJson(breadcrumbs)}</script>
    `;

    // Plain semantic content for crawlers that don't run JS. React replaces it on load.
    const body = `
    <main class="prerender-job">
      <nav aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/jobs">Jobs</a> › <span>${escapeHtml(job.title)}</span></nav>
      <h1>${escapeHtml(job.title)}</h1>
      <p><strong>${escapeHtml(job.company)}</strong> · ${escapeHtml(job.type)} · ${escapeHtml(job.workMode)} · ${escapeHtml(job.location)}${job.salary ? ` · ${escapeHtml(job.salary)}` : ''}</p>
      ${job.skills?.length ? `<p>Skills: ${job.skills.map(escapeHtml).join(', ')}</p>` : ''}
      <h2>About this role</h2>
      ${job.description.split(/\n+/).map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
      <p><a href="${escapeHtml(job.applyUrl || `/jobs/${job.slug}#apply`)}">Apply for ${escapeHtml(job.title)}</a></p>
    </main>`;

    return stripSeoTags(shell)
        .replace('</head>', `${head}</head>`)
        .replace(/<div id="root">[\s\S]*?<\/div>\s*<script/, `<div id="root">${body}</div><script`);
};

export const buildSitemap = ({ staticRoutes, blogSlugs, jobs }) => {
    const now = new Date().toISOString();
    const entry = (loc, lastmod, changefreq, priority) => `  <url><loc>${env.siteUrl}${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
    const urls = [
        ...staticRoutes.map((r) => entry(r.path, now, r.changefreq ?? 'weekly', r.priority ?? '0.7')),
        ...blogSlugs.map((b) => entry(`/blog/${b.slug}`, b.updatedAt ?? now, 'monthly', '0.6')),
        ...jobs.map((j) => entry(`/jobs/${j.slug}`, new Date(j.updatedAt).toISOString(), 'weekly', '0.8')),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
};
