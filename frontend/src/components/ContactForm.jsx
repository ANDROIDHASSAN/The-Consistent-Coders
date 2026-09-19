import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useGame } from '../context/GameContext';

/** Reusable contact form. Posts to /api/contact; used on Contact and as the per-page footer form. */
export const ContactForm = ({ compact = false, subject = '' }) => {
    const location = useLocation();
    const { toast, play } = useGame();
    const [form, setForm] = useState({ name: '', email: '', subject, message: '', website: '' });
    const [state, setState] = useState('idle'); // idle | sending | sent | error
    const [error, setError] = useState('');

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setState('sending');
        setError('');
        try {
            await apiFetch('/contact', { method: 'POST', body: { ...form, page: location.pathname } });
            setState('sent');
            toast('Message sent. We reply within 48 hours.', { kind: 'success', sound: 'success' });
            setForm({ name: '', email: '', subject, message: '', website: '' });
        }
        catch (err) {
            setState('error');
            setError(err.message);
            play('error');
        }
    };

    return (
        <form className={`tcc-form ${compact ? "tcc-form--compact" : ""}`} onSubmit={submit} noValidate>
            <div className="form-grid">
                <label className="field">
                    <span className="mono-text">Name</span>
                    <input type="text" name="name" autoComplete="name" required value={form.name} onChange={update('name')} />
                </label>
                <label className="field">
                    <span className="mono-text">Email</span>
                    <input type="email" name="email" autoComplete="email" required value={form.email} onChange={update('email')} />
                </label>
            </div>
            {!compact && (
                <label className="field">
                    <span className="mono-text">Subject</span>
                    <input type="text" name="subject" value={form.subject} onChange={update('subject')} />
                </label>
            )}
            <label className="field">
                <span className="mono-text">Message</span>
                <textarea name="message" rows={compact ? 3 : 6} required minLength={10} value={form.message} onChange={update('message')} />
            </label>
            {/* Honeypot — hidden from humans, filled by bots */}
            <label className="hp" aria-hidden="true">
                Website<input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {state === 'sent' && <p className="form-success" role="status">Sent! We'll get back to you soon.</p>}
            <button type="submit" className="btn-primary" disabled={state === 'sending'}>
                <span className="btn-text">{state === 'sending' ? 'SENDING…' : 'SEND MESSAGE →'}</span>
                <div className="btn-bg"></div>
            </button>
        </form>
    );
};
