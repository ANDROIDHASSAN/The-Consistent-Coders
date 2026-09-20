import cors from 'cors';
import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notFound.middleware.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

const app = express();

app.disable('x-powered-by');
// JSON is cached at the CDN via s-maxage; ETag/304 revalidation added nothing and
// stalled some browser requests through the dev proxy.
app.set('etag', false);
app.use(cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',').map((origin) => origin.trim()),
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
// Serverless (Vercel) has no startup hook, so make sure the DB is connected per request.
const NO_DB_OK = ['/api/health', '/api/jobs/options'];
app.use(async (req, res, next) => {
    if (NO_DB_OK.includes(req.path)) return next();
    if (!env.mongoUri) {
        res.status(503).json({ success: false, message: 'The directory is not connected to a database yet. Set MONGO_URI on the server.' });
        return;
    }
    try {
        await connectDatabase();
        next();
    }
    catch (error) {
        res.status(503).json({ success: false, message: 'Database is unreachable right now. Try again in a minute.' });
    }
});
// Public routes (jobs, sitemap, blog) must keep working even if Clerk isn't configured yet;
// without keys, every request is simply treated as signed-out.
if (env.clerkSecretKey && env.clerkPublishableKey) {
    app.use(clerkMiddleware({ secretKey: env.clerkSecretKey, publishableKey: env.clerkPublishableKey }));
}
else {
    console.warn('Clerk keys missing — running with sign-in disabled.');
}
// Vercel rewrites /sitemap.xml and /jobs/:slug to this function but hands us the
// original URL, so map them onto the SEO routes here.
app.use((req, _res, next) => {
    if (req.path === '/sitemap.xml') req.url = '/api/seo/sitemap.xml';
    else if (/^\/jobs\/(?!new$)[^/]+$/.test(req.path)) req.url = `/api/seo/render/job/${req.path.slice('/jobs/'.length)}`;
    next();
});
app.use('/api', apiRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
