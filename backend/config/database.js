import mongoose from 'mongoose';
import { env } from './env.js';

// Fail fast when there is no DB instead of buffering queries for 10s.
mongoose.set('bufferCommands', false);

let connectionPromise = null;

export const connectDatabase = async () => {
    if (!env.mongoUri) {
        throw new Error('MONGO_URI is not configured');
    }
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }
    if (!connectionPromise) {
        // Fail in 5s instead of the 30s default so a DB outage returns a quick 503, not a hung request.
        connectionPromise = mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 })
            .catch((error) => { connectionPromise = null; throw error; });
    }
    return connectionPromise;
};
