// Single source of truth for every static, indexable URL.
// Used by: the build-time prerender, the sitemap, and the navigation.
// Plain JS on purpose (no JSX) so the backend can import it for the sitemap.

export const STATIC_ROUTES = [
    { path: '/', name: 'Home', changefreq: 'daily', priority: '1.0' },
    { path: '/jobs', name: 'Jobs', changefreq: 'hourly', priority: '0.9' },
    { path: '/jobs/new', name: 'Post a Job', changefreq: 'monthly', priority: '0.6' },
    { path: '/how-it-works', name: 'How it works', changefreq: 'monthly', priority: '0.8' },
    { path: '/projects', name: 'Projects', changefreq: 'daily', priority: '0.8' },
    { path: '/leaderboard', name: 'Leaderboard', changefreq: 'daily', priority: '0.7' },
    { path: '/blog', name: 'Blog', changefreq: 'weekly', priority: '0.8' },
    { path: '/learn', name: 'Learn', changefreq: 'monthly', priority: '0.7' },
    { path: '/build', name: 'Build', changefreq: 'monthly', priority: '0.7' },
    { path: '/tasks', name: 'Tasks', changefreq: 'weekly', priority: '0.6' },
    { path: '/contributors', name: 'Honor', changefreq: 'weekly', priority: '0.5' },
    { path: '/join', name: 'Join', changefreq: 'monthly', priority: '0.6' },
    { path: '/contact', name: 'Contact', changefreq: 'yearly', priority: '0.4' },
];

// Routes that exist but must not be indexed or prerendered.
export const PRIVATE_ROUTES = ['/profile'];
