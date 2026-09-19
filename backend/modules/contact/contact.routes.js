import { Router } from 'express';
import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    subject: { type: String, default: '', trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    page: { type: String, default: '', maxlength: 200 },
}, { timestamps: true });

export const ContactMessage = mongoose.models.ContactMessage || mongoose.model('ContactMessage', contactSchema);

const router = Router();

router.post('/', async (req, res, next) => {
    try {
        const name = String(req.body?.name ?? '').trim();
        const email = String(req.body?.email ?? '').trim();
        const subject = String(req.body?.subject ?? '').trim();
        const message = String(req.body?.message ?? '').trim();
        const page = String(req.body?.page ?? '').trim();
        // Honeypot: bots fill every field; humans never see this one.
        if (req.body?.website) return res.status(200).json({ success: true });

        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
            return res.status(400).json({ success: false, message: 'Name, a valid email and a message of at least 10 characters are required.' });
        }
        await ContactMessage.create({ name, email, subject, message, page });
        res.status(201).json({ success: true });
    }
    catch (error) {
        next(error);
    }
});

export default router;
