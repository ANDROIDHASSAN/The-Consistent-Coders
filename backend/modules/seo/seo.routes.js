import { Router } from 'express';
import { Job } from '../jobs/job.model.js';
import { buildSitemap, loadShell, renderJobPage } from './seo.service.js';
import { STATIC_ROUTES } from '../../../frontend/src/content/siteRoutes.js';
import { BLOG_POSTS } from '../../../frontend/src/content/blog/meta.js';

const router = Router();

router.get('/sitemap.xml', async (req, res, next) => {
    try {
        const jobs = await Job.find({ status: 'open' }).select('slug updatedAt').sort({ updatedAt: -1 }).limit(5000).lean();
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600');
        res.send(buildSitemap({ staticRoutes: STATIC_ROUTES, blogSlugs: BLOG_POSTS, jobs }));
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
        res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
        res.send(renderJobPage(shell, job));
    }
    catch (error) {
        next(error);
    }
});

export default router;
