// One-off: give every job posted before categories existed its category.
// Run once after deploying: `npm run backfill:categories` (uses MONGO_URI from .env). Safe to re-run.
import { connectDatabase } from '../config/database.js';
import { Job } from '../modules/jobs/job.model.js';
import { categoryOf } from '../../frontend/src/content/jobCategories.js';
import mongoose from 'mongoose';

await connectDatabase();
const jobs = await Job.find({ category: { $exists: false } }).select('title company skills description').lean();
if (jobs.length) {
    await Job.bulkWrite(jobs.map((j) => ({ updateOne: { filter: { _id: j._id }, update: { $set: { category: categoryOf(j) } } } })));
}
console.log(`categorised ${jobs.length} job(s)`);
await mongoose.disconnect();
