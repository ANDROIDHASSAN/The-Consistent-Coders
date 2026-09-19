/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from 'react';

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.consistentcoders.com').replace(/\/$/, '');
export const SITE_NAME = 'The Consistent Coders';
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

// During build-time prerender, App is rendered inside a SeoCollector provider;
// each <Seo> pushes its tags there so the script can write them into <head>.
export const SeoCollector = createContext(null);

const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

export const buildTags = ({ title, description, path = '/', type = 'website', image = DEFAULT_IMAGE, noindex = false, jsonLd = [] }) => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${path === '/' ? '' : path.replace(/\/$/, '')}`;
    const metas = [
        ['name', 'description', description],
        ['name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'],
        ['property', 'og:type', type],
        ['property', 'og:site_name', SITE_NAME],
        ['property', 'og:title', fullTitle],
        ['property', 'og:description', description],
        ['property', 'og:url', url],
        ['property', 'og:image', image],
        ['property', 'og:locale', 'en_IN'],
        ['name', 'twitter:card', 'summary_large_image'],
        ['name', 'twitter:title', fullTitle],
        ['name', 'twitter:description', description],
        ['name', 'twitter:image', image],
    ];
    return { title: fullTitle, url, metas, jsonLd: Array.isArray(jsonLd) ? jsonLd : [jsonLd] };
};

export const tagsToHtml = ({ title, url, metas, jsonLd }) => [
    `<title>${escape(title)}</title>`,
    ...metas.map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escape(value)}" />`),
    `<link rel="canonical" href="${url}" />`,
    ...jsonLd.map((obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`),
].join('\n    ');

const applyToDom = ({ title, url, metas, jsonLd }) => {
    document.title = title;
    metas.forEach(([attr, key, value]) => {
        let el = document.head.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', value);
    });
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
    jsonLd.forEach((obj) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(obj);
        document.head.appendChild(script);
    });
};

/**
 * One component sets everything a page needs to rank: title, description,
 * canonical, Open Graph, Twitter card and JSON-LD. Use once per page.
 */
export const Seo = (props) => {
    const collector = useContext(SeoCollector);
    const tags = buildTags(props);
    collector?.set(tags);
    const key = JSON.stringify(tags);
    useEffect(() => {
        applyToDom(JSON.parse(key));
    }, [key]);
    return null;
};

// ---- JSON-LD helpers -------------------------------------------------------

export const organizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.png`,
    sameAs: [
        'https://www.linkedin.com/company/the-consistent-coders/',
        'https://github.com/ANDROIDHASSAN',
        'https://discord.gg/F7bWaYqf',
    ],
});

export const websiteSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/jobs?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
    },
});

export const breadcrumbSchema = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
    })),
});

export const faqSchema = (faqs) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
});

export const articleSchema = (post) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` } },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    image: DEFAULT_IMAGE,
});

export const jobPostingSchema = (job) => {
    const employmentType = {
        'Full-time': 'FULL_TIME', 'Part-time': 'PART_TIME', Internship: 'INTERN', Contract: 'CONTRACTOR', Freelance: 'CONTRACTOR',
    }[job.type] ?? 'OTHER';
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: `<p>${escape(job.description).replace(/\n+/g, '</p><p>')}</p>`,
        datePosted: new Date(job.createdAt).toISOString(),
        employmentType,
        hiringOrganization: { '@type': 'Organization', name: job.company, ...(job.companyUrl ? { sameAs: job.companyUrl } : {}) },
        jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: job.location, addressCountry: 'IN' } },
        directApply: !job.applyUrl,
        url: `${SITE_URL}/jobs/${job.slug}`,
        identifier: { '@type': 'PropertyValue', name: SITE_NAME, value: job.slug },
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
