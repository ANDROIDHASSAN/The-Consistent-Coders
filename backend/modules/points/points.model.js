import mongoose from 'mongoose';

// Append-only ledger. User.points is the cached sum; the ledger is the audit trail.
const pointEventSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true }, // job_posted | job_applied | profile_completed | daily_login
    points: { type: Number, required: true },
    ref: { type: String, default: '' }, // job slug, etc.
    track: { type: String, default: 'general', index: true }, // learn | build | hire | apply | general
}, {
    timestamps: true,
});

// Unique when a ref is set, so a double-click can never pay twice (the DB enforces it, not a read-then-write).
pointEventSchema.index({ user: 1, type: 1, ref: 1 }, { unique: true, partialFilterExpression: { ref: { $gt: '' } } });

// Weekly boards + activity heatmap scan by time.
pointEventSchema.index({ createdAt: -1, track: 1 });
pointEventSchema.index({ user: 1, createdAt: -1 });

export const PointEvent = mongoose.models.PointEvent || mongoose.model('PointEvent', pointEventSchema);
