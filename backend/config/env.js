import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const toList = (value) => (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: Boolean(process.env.VERCEL),
    port: toNumber(process.env.PORT, 5000),
    mongoUri: process.env.MONGO_URI ?? '',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    clerkSecretKey: process.env.CLERK_SECRET_KEY ?? '',
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? '',
    // Lower-cased emails that may moderate any job.
    adminEmails: toList(process.env.ADMIN_EMAILS),
    // Public origin used in sitemap + canonical URLs. No trailing slash.
    siteUrl: (process.env.SITE_URL ?? 'https://www.consistentcoders.com').replace(/\/$/, ''),
};
