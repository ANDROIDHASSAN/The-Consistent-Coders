import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

export const env = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: Boolean(process.env.VERCEL),
    port: toNumber(process.env.PORT, 5000),
    mongoUri: process.env.MONGO_URI ?? '',
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
    googleClientId: process.env.CLIENT_ID ?? '',
    googleClientSecret: process.env.CLIENT_SECRET ?? '',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
    callbackUrl: process.env.CALLBACK_URL ?? '',
};
