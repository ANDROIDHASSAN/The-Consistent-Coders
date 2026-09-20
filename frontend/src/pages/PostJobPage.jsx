import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SignInButton } from '@clerk/react';
import { Seo } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { useApi } from '../lib/api';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';

const TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const MODES = ['Remote', 'Hybrid', 'On-site'];
const LEVELS = ['Fresher', 'Junior', 'Mid', 'Senior'];

const EMPTY = {
    title: '', company: '', companyUrl: '', type: 'Full-time', workMode: 'Remote', experience: 'Fresher',
    location: 'Remote', salary: '', skills: '', description: '', applyUrl: '', deadline: '',
};

const TEMPLATE = `What you'll do:
-
-

What we're looking for:
-
-

Nice to have:
-

How to apply:
`;

const DRAFT_KEY = 'tcc:jobDraft';
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null; } catch { return null; } };
const REQUIRED = ['title', 'company', 'location', 'description'];

/** Create (/jobs/new) and edit (/jobs/:slug/edit) share this page. */
export const PostJobPage = () => {
    const { slug } = useParams();
    const editing = Boolean(slug);
    const api = useApi();
    const navigate = useNavigate();
    const { isSignedIn, isLoaded } = useSession();
    const { celebrate, toast, play, me } = useGame();
    // A draft survives the sign-in round trip, so pasting before signing in loses nothing.
    const [form, setForm] = useState(() => (editing ? EMPTY : { ...EMPTY, ...readDraft() }));
    const [jobId, setJobId] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [paste, setPaste] = useState('');
    const [filling, setFilling] = useState(false);
    const [filled, setFilled] = useState(null); // { count, missing[] } after a successful autofill
    const [pasteError, setPasteError] = useState('');

    useEffect(() => {
        if (editing) return;
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* private mode */ }
    }, [form, editing]);

    const autofill = async (raw) => {
        const text = String(raw ?? paste).trim();
        if (text.length < 10) return;
        if (!isSignedIn) { setFilled({ pending: true }); return; } // draft is saved; we fill right after sign-in
        setFilling(true);
        setPasteError('');
        try {
            const { draft } = await api('/jobs/extract', { method: 'POST', body: /^https?:\/\/\S+$/i.test(text) ? { url: text } : { text } });
            const next = {
                ...EMPTY,
                ...draft,
                skills: (draft.skills || []).join(', '),
                description: draft.description || '',
                applyUrl: draft.applyUrl || '',
                company: draft.company || org || '',
            };
            delete next.sourceUrl;
            setForm(next);
            const missing = REQUIRED.filter((k) => !next[k] || (k === 'description' && next[k].length < 80));
            setFilled({ count: Object.keys(EMPTY).filter((k) => next[k] && next[k] !== EMPTY[k]).length, missing });
            play(missing.length ? 'click' : 'success');
            setTimeout(() => document.getElementById(missing[0] || 'publish')?.focus(), 50);
        }
        catch (err) {
            setFilled(null);
            setPasteError(err.message);
            play('error');
        }
        finally { setFilling(false); }
    };

    // Pasted before sign-in → fill as soon as the session lands.
    useEffect(() => {
        if (isSignedIn && filled?.pending && paste) autofill(paste);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when sign-in completes
    }, [isSignedIn]);

    // Pre-fill the company a poster told us about during onboarding.
    const org = me?.user?.org;
    useEffect(() => {
        if (!editing && org) setForm((f) => (f.company ? f : { ...f, company: org }));
    }, [editing, org]);

    useEffect(() => {
        if (!editing || !isLoaded) return;
        api(`/jobs/${slug}`).then((res) => {
            const j = res.job;
            setJobId(j.id);
            setForm({
                title: j.title, company: j.company, companyUrl: j.companyUrl, type: j.type, workMode: j.workMode,
                experience: j.experience, location: j.location, salary: j.salary, skills: j.skills.join(', '),
                description: j.description, applyUrl: j.applyUrl, deadline: j.deadline ? j.deadline.slice(0, 10) : '',
            });
        }).catch((err) => setError(err.message));
    }, [api, editing, slug, isLoaded]);

    const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const body = { ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean), deadline: form.deadline || null };
            if (editing) {
                const res = await api(`/jobs/${jobId}`, { method: 'PATCH', body });
                toast('Job updated.', { kind: 'success', sound: 'success' });
                navigate(`/jobs/${res.job.slug}`);
            }
            else {
                const res = await api('/jobs', { method: 'POST', body });
                try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
                await celebrate(res.reward, 'job posted');
                navigate(`/jobs/${res.job.slug}`);
            }
        }
        catch (err) {
            setError(err.message);
            play('error');
            setBusy(false);
        }
    };

    const crumbs = editing
        ? [{ name: 'Jobs', path: '/jobs' }, { name: 'Edit job', path: `/jobs/${slug}/edit` }]
        : [{ name: 'Jobs', path: '/jobs' }, { name: 'Post a job', path: '/jobs/new' }];

    return (
        <>
            <Seo
                title={editing ? 'Edit job' : 'Post a Developer Job or Internship for Free'}
                description="Post a developer job or internship for free on The Consistent Coders. Reach hundreds of students and early-career engineers in India, and earn a point on the leaderboard."
                path={editing ? `/jobs/${slug}/edit` : '/jobs/new'}
                noindex={editing}
                jsonLd={Breadcrumbs.schema(crumbs)}
            />
            <div className="page">
                <div className="container--narrow">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head">
                        <p className="page-eyebrow mono-text">// {editing ? 'EDIT LISTING' : 'FREE LISTING · +1 POINT'}</p>
                        <h1 className="page-title">{editing ? 'Edit your job' : <>Paste a job. <em>We fill the form.</em></>}</h1>
                        <p className="page-lede">
                            {editing
                                ? 'Update the listing. Changes go live instantly.'
                                : 'Got a job from WhatsApp or LinkedIn? Paste the text or the link — title, company, skills and salary fill themselves. Check, publish, +1 point.'}
                        </p>
                    </header>

                    {!CLERK_ENABLED ? (
                        <p className="empty">Sign-in isn't configured yet (missing <code>VITE_CLERK_PUBLISHABLE_KEY</code>).</p>
                    ) : !isLoaded ? (
                        <div className="skeleton" />
                    ) : (
                        <form className="panel" onSubmit={submit}>
                            {!editing && (
                                <div className={`paste-box${filling ? ' is-busy' : ''}`}>
                                    <label className="field">
                                        <span>Paste the job post or a link <b className="paste-kbd">⌘V</b></span>
                                        <textarea
                                            rows={4}
                                            placeholder={'🚨 Hiring – Backend Engineer (Freshers)\nCompany: Work360\nSkills: Java / Python / Node.js\nApply: https://…\n\n…or just a LinkedIn / careers-page link'}
                                            value={paste}
                                            onChange={(e) => setPaste(e.target.value)}
                                            onPaste={(e) => { const t = e.clipboardData.getData('text'); if (t.trim()) { setPaste(t); setTimeout(() => autofill(t), 0); } }}
                                        />
                                    </label>
                                    <div className="paste-actions">
                                        <button type="button" className="btn-ghost btn-sm" disabled={filling || paste.trim().length < 10} onClick={() => autofill()}>
                                            {filling ? 'READING…' : 'AUTOFILL ↓'}
                                        </button>
                                        {filled?.pending && !isSignedIn && <span className="field-hint">Sign in below and we'll fill the form from what you pasted.</span>}
                                        {filled && !filled.pending && (
                                            <span className={`field-hint${filled.missing.length ? '' : ' is-ok'}`} role="status">
                                                {filled.missing.length
                                                    ? <>Filled {filled.count} fields — just add <b>{filled.missing.join(', ')}</b>.</>
                                                    : <>Filled {filled.count} fields. Looks complete — hit publish.</>}
                                            </span>
                                        )}
                                    </div>
                                    {pasteError && <p className="form-error" role="alert" style={{ marginBottom: 0 }}>{pasteError}</p>}
                                </div>
                            )}
                            <div className="form-grid">
                                <label className="field"><span>Job title *</span><input id="title" required minLength={3} maxLength={120} placeholder="Frontend Developer Intern" value={form.title} onChange={update('title')} /></label>
                                <label className="field"><span>Company *</span><input id="company" required minLength={2} maxLength={120} placeholder="Acme Labs" value={form.company} onChange={update('company')} /></label>
                            </div>
                            <div className="form-grid">
                                <label className="field"><span>Job type *</span><select value={form.type} onChange={update('type')}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
                                <label className="field"><span>Work mode *</span><select value={form.workMode} onChange={update('workMode')}>{MODES.map((t) => <option key={t}>{t}</option>)}</select></label>
                                <label className="field"><span>Experience *</span><select value={form.experience} onChange={update('experience')}>{LEVELS.map((t) => <option key={t}>{t}</option>)}</select></label>
                            </div>
                            <div className="form-grid">
                                <label className="field"><span>Location *</span><input id="location" required maxLength={120} placeholder="Bengaluru / Remote (India)" value={form.location} onChange={update('location')} /></label>
                                <label className="field"><span>Salary / stipend</span><input maxLength={80} placeholder="₹6–8 LPA or ₹15K/month" value={form.salary} onChange={update('salary')} /></label>
                            </div>
                            <label className="field">
                                <span>Skills (comma separated)</span>
                                <input placeholder="React, Node.js, MongoDB" value={form.skills} onChange={update('skills')} />
                            </label>
                            <label className="field">
                                <span>Description * (min 80 characters)</span>
                                <textarea id="description" required minLength={80} maxLength={8000} rows={12} value={form.description} onChange={update('description')} placeholder={TEMPLATE} />
                                <span className="field-hint">{form.description.length} / 8000 · Use short paragraphs and dashes for bullet points. <button type="button" className="btn-ghost btn-sm" style={{ marginLeft: '0.5rem' }} onClick={() => setForm((f) => ({ ...f, description: f.description || TEMPLATE }))}>Insert template</button></span>
                            </label>
                            <div className="form-grid">
                                <label className="field"><span>External apply link (optional)</span><input type="text" placeholder="https://… or mailto:hr@company.com" value={form.applyUrl} onChange={update('applyUrl')} /><span className="field-hint">Leave empty to receive applications here on the site.</span></label>
                                <label className="field"><span>Company website (optional)</span><input type="url" placeholder="https://company.com" value={form.companyUrl} onChange={update('companyUrl')} /></label>
                            </div>
                            <label className="field"><span>Application deadline (optional)</span><input type="date" value={form.deadline} onChange={update('deadline')} /></label>
                            {error && <p className="form-error" role="alert">{error}</p>}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {isSignedIn ? (
                                    <button id="publish" type="submit" className="btn-primary" disabled={busy}>
                                        <span className="btn-text">{busy ? 'SAVING…' : editing ? 'SAVE CHANGES' : 'PUBLISH JOB (+1 PT)'}</span>
                                        <div className="btn-bg"></div>
                                    </button>
                                ) : (
                                    <SignInButton mode="modal">
                                        <button type="button" className="btn-primary" onClick={() => play('click')}>
                                            <span className="btn-text">SIGN IN TO PUBLISH (+1 PT)</span>
                                            <div className="btn-bg"></div>
                                        </button>
                                    </SignInButton>
                                )}
                                <Link to={editing ? `/jobs/${slug}` : '/jobs'} className="btn-ghost">Cancel</Link>
                                {!isSignedIn && <span className="field-hint">Free account, one click with Google. Your draft is kept.</span>}
                            </div>
                        </form>
                    )}

                    <section className="section-gap">
                        <h2 className="h2">Tips for a listing that gets applicants</h2>
                        <div className="steps">
                            <div className="step"><b>01</b><h3>Be specific in the title</h3><p>"React Developer Intern (Remote, 3 months)" beats "Developer". Google and candidates both search by exact phrases.</p></div>
                            <div className="step"><b>02</b><h3>Show the money</h3><p>Listings with a salary or stipend get roughly twice the applications. A range is fine.</p></div>
                            <div className="step"><b>03</b><h3>List real skills</h3><p>Three to six skills you'd actually interview on. Skip "rockstar" and "ninja".</p></div>
                            <div className="step"><b>04</b><h3>Say how to apply</h3><p>If there's an external form, link it. Otherwise applications land in your dashboard here.</p></div>
                        </div>
                        <p style={{ marginTop: '1.5rem' }}><Link to="/blog/how-to-write-a-job-post-that-gets-applicants">Read the full guide: how to write a job post that gets applicants →</Link></p>
                    </section>
                </div>
                <Cta title="Looking for a role instead?" text="Browse open jobs and internships posted by the community. Every application earns you a point." primary={{ to: '/jobs', label: 'BROWSE JOBS →' }} secondary={{ to: '/leaderboard', label: 'SEE LEADERBOARD' }} />
            </div>
            <Footer />
        </>
    );
};
