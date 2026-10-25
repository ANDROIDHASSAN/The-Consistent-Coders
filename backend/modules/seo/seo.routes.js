import { Router } from 'express';
import { Job } from '../jobs/job.model.js';
import { listJobs, openFilter, openSkills } from '../jobs/job.service.js';
import { buildSitemap, loadShell, renderJobPage, renderListPage } from './seo.service.js';
import { STATIC_ROUTES } from '../../../frontend/src/content/siteRoutes.js';
import { BLOG_POSTS } from '../../../frontend/src/content/blog/meta.js';
import { CITIES, categoryOf, cityBySlug, cityOf, companyPage, isPlaceholder, listPageTitle, skillSlug, slugify } from '../../../frontend/src/content/jobCategories.js';

const router = Router();

// A company, city or skill page with one job only repeats that job's own page (thin, doorway-like),
// so it stays noindex and out of the sitemap until a second open job lands on it.
const MIN_INDEX_JOBS = 2;

router.get('/sitemap.xml', async (req, res, next) => {
    try {
        const jobs = await Job.find(openFilter()).select('slug updatedAt company location workMode skills category title').sort({ updatedAt: -1 }).limit(5000).lean();
        // Every list page a job feeds, with its job count and newest change (jobs come newest first).
        const pages = new Map();
        const feed = (path, job) => {
            const page = pages.get(path) ?? { path, lastmod: job.updatedAt, jobs: 0 };
            page.jobs += 1;
            pages.set(path, page);
        };
        for (const job of jobs) {
            feed('/jobs', job);
            feed(`/jobs/category/${job.category || categoryOf(job)}`, job);
            if (!isPlaceholder(job.company)) feed(`/jobs/company/${slugify(job.company)}`, job);
            for (const city of new Set([job.workMode === 'Remote' && 'remote', cityOf(job.location)?.slug].filter(Boolean))) feed(`/jobs/in/${city}`, job);
            for (const skill of new Set((job.skills ?? []).map(skillSlug).filter(Boolean))) feed(`/jobs/skill/${skill}`, job);
        }
        const staticRoutes = STATIC_ROUTES.map((r) => ({ ...r, lastmod: pages.get(r.path)?.lastmod }));
        const listPages = [...pages.values()].filter((p) => /^\/jobs\/(?:company|in|skill)\//.test(p.path) && p.jobs >= MIN_INDEX_JOBS);
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
        res.send(buildSitemap({ staticRoutes, blogSlugs: BLOG_POSTS, jobs, listPages }));
    }
    catch (error) {
        next(error);
    }
});

const sendList = async (res, page) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.send(renderListPage(await loadShell(), page));
};

// /jobs/company/:slug — every open job at one company.
router.get('/render/company/:slug', async (req, res, next) => {
    try {
        const { items, company } = await listJobs({ company: req.params.slug, limit: 100 });
        if (!company) {
            res.status(404).set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).send(await loadShell());
            return;
        }
        await sendList(res, {
            path: `/jobs/company/${slugify(company)}`,
            heading: listPageTitle({ company }),
            crumb: company,
            ...companyPage(company, items),
            jobs: items,
            noindex: items.length < MIN_INDEX_JOBS,
        });
    }
    catch (error) {
        next(error);
    }
});

// /jobs/skill/:slug — every open job asking for one skill, under any spelling of it.
router.get('/render/skill/:slug', async (req, res, next) => {
    try {
        const [{ items, skill }, skills] = await Promise.all([listJobs({ skill: req.params.slug, limit: 100 }), openSkills()]);
        if (!skill) {
            res.status(404).set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).send(await loadShell());
            return;
        }
        // One URL per skill: /jobs/skill/reactjs and /jobs/skill/react-js move to /jobs/skill/react.
        if (req.params.slug !== skillSlug(skill)) {
            res.redirect(301, `/jobs/skill/${skillSlug(skill)}`);
            return;
        }
        // Links that follow the data: the skills these same jobs also ask for, most shared first.
        const together = new Map();
        for (const j of items) for (const k of new Set(j.skills.map(skillSlug))) if (k && k !== req.params.slug) together.set(k, (together.get(k) ?? 0) + 1);
        const related = [...together].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => ({ path: `/jobs/skill/${k}`, name: `${skills.get(k)?.name ?? k} jobs` }));
        const companies = [...new Set(items.map((j) => j.company).filter((c) => !isPlaceholder(c)))].slice(0, 3);
        const roles = [...new Set(items.map((j) => j.title))].slice(0, 2);
        await sendList(res, {
            path: `/jobs/skill/${skillSlug(skill)}`,
            heading: listPageTitle({ skill }),
            crumb: skill,
            description: `${skill} jobs and internships for freshers: ${items.length} open role${items.length === 1 ? '' : 's'}${companies.length ? ` at ${companies.join(', ')}` : ''}, including ${roles.join(', ')}. Every role checked by admins. Free to apply.`,
            jobs: items,
            noindex: items.length < MIN_INDEX_JOBS,
            siblings: related,
        });
    }
    catch (error) {
        next(error);
    }
});

// /jobs/in/:slug — developer jobs in one city, or remote.
router.get('/render/city/:slug', async (req, res, next) => {
    try {
        const city = cityBySlug(req.params.slug);
        if (!city) {
            res.status(404).set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).send(await loadShell());
            return;
        }
        const { items } = await listJobs({ location: city.slug, limit: 100 });
        const where = city.slug === 'remote' ? 'remote' : `in ${city.name}`;
        const companies = [...new Set(items.map((j) => j.company).filter((c) => !isPlaceholder(c)))].slice(0, 3);
        await sendList(res, {
            path: `/jobs/in/${city.slug}`,
            heading: listPageTitle({ city }),
            crumb: city.name,
            description: `Fresher-friendly ${city.slug === 'remote' ? 'remote developer jobs and internships' : `developer jobs and internships ${where}`}${companies.length ? ` at ${companies.join(', ')}` : ''}. Every role checked by admins. Free to apply.`,
            jobs: items,
            noindex: items.length < MIN_INDEX_JOBS,
            siblings: CITIES.filter((c) => c.slug !== city.slug).map((c) => ({ path: `/jobs/in/${c.slug}`, name: c.slug === 'remote' ? 'Remote jobs' : `Jobs in ${c.name}` })),
        });
    }
    catch (error) {
        next(error);
    }
});

// Crawler-ready HTML for /jobs/:slug — Vercel rewrites that path here.
router.get('/render/job/:slug', async (req, res, next) => {
    try {
        const [shell, job] = await Promise.all([
            loadShell(),
            Job.findOne({ slug: req.params.slug }).lean(),
        ]);
        res.set('Content-Type', 'text/html; charset=utf-8');
        if (!job) {
            res.status(404).set('Cache-Control', 'no-store').send(shell);
            return;
        }
        const related = await Job.find({ ...openFilter(), category: job.category || categoryOf(job), _id: { $ne: job._id } })
            .sort({ createdAt: -1 }).limit(5).select('slug title company workMode location salary experience type').lean();
        res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        res.send(renderJobPage(shell, job, related));
    }
    catch (error) {
        next(error);
    }
});

export default router;
