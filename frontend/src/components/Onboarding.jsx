import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../lib/api';
import { useGame } from '../context/GameContext';
import { startTour } from './NavTour';
import { ARENAS } from './Gamification';

const INTENTS = [
    { id: 'find', icon: '🎯', title: 'Find a job', text: 'Browse roles, apply in one click, track every application.' },
    { id: 'hire', icon: '📣', title: 'Post a job', text: 'Share an opening you know about. Get applicants in your dashboard.' },
    { id: 'both', icon: '⚡', title: 'Both', text: 'Hunting for a role and know openings to share.' },
];
const EXPERIENCE = [
    { id: 'Student', text: 'Still studying' },
    { id: 'Fresher', text: '0–1 year' },
    { id: 'Junior', text: '1–3 years' },
    { id: 'Mid', text: '3–6 years' },
    { id: 'Senior', text: '6+ years' },
];
const POPULAR_SKILLS = ['React', 'JavaScript', 'Node.js', 'Python', 'Java', 'TypeScript', 'MongoDB', 'SQL', 'Flutter', 'UI/UX', 'DevOps', 'Data Science'];
const JOB_TYPES = ['Internship', 'Full-time', 'Part-time', 'Contract', 'Freelance'];
const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const PLATFORM = [
    { icon: '💼', title: 'Jobs', text: 'Every open role, searchable by skill, city, remote and level. Card or table view.', where: 'Navbar → Jobs' },
    { icon: '📣', title: 'Post a job', text: 'Know an opening? A two-minute form puts it live and on Google. +1 point.', where: 'Any page → "Post a job"' },
    { icon: '🏠', title: 'Your dashboard', text: 'Points, rank, badges, checklist, applications you sent and jobs you posted.', where: 'Click your score, top right' },
    { icon: '🏆', title: 'Leaderboard', text: 'Everyone ranked by points. Climb from Rookie to Legend.', where: 'Navbar → Leaderboard' },
    { icon: '📚', title: 'Blog & guides', text: 'How to get hired: resumes, projects, referrals, GitHub, remote work.', where: 'Navbar → Blog' },
    { icon: '🛠️', title: 'Projects & missions', text: 'Ship projects, collect upvotes, and finish missions with a PR link. The Building arena.', where: 'Navbar → Projects / Tasks' },
    { icon: '📖', title: 'Learning paths', text: '9 structured paths. Tick off each checkpoint as you learn it. The Learning arena.', where: 'Navbar → Learn' },
    { icon: '💬', title: 'Community', text: 'Discord and WhatsApp for referrals, doubts and HR contacts from 500+ members.', where: 'Footer on every page' },
];
const STEPS = ['Welcome', 'About', 'Skills', 'Goals', 'Platform', 'Points', 'Go'];

const Choice = ({ on, onClick, icon, title, text, role = 'radio' }) => (
    <button type="button" role={role} aria-checked={role === 'radio' ? on : undefined} aria-pressed={role === 'radio' ? undefined : on}
        className={`onb-choice ${on ? 'is-on' : ''}`} onClick={onClick}>
        {icon && <span className="onb-choice-icon" aria-hidden="true">{icon}</span>}
        <strong>{title}</strong>
        {text && <span>{text}</span>}
    </button>
);

/**
 * First-sign-in onboarding. Seven short steps: who you are, what you want, what the
 * platform offers, how points work, and your first action. Each step saves as you go,
 * so skipping midway keeps what was entered. Ends by starting the navbar tour.
 */
export const Onboarding = () => {
    const { me, refreshMe, celebrate, play, toast } = useGame();
    const api = useApi();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [f, setF] = useState(null);
    const [custom, setCustom] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const dialogRef = useRef(null);

    const open = Boolean(me?.user && !me.user.onboarded);

    useEffect(() => {
        if (open && !f) {
            const u = me.user;
            setF({
                name: u.name || '', intent: u.intent || '', headline: u.headline || '', experience: u.experience || '',
                city: u.city || '', org: u.org || '', skills: u.skills || [],
                github: u.links.github, linkedin: u.links.linkedin, portfolio: u.links.portfolio,
                types: u.prefs.types, modes: u.prefs.modes,
            });
        }
    }, [open, f, me]);

    useEffect(() => {
        if (open) dialogRef.current?.scrollTo?.(0, 0);
        if (open) dialogRef.current?.focus();
    }, [open, step]);

    if (!open || !f) return null;

    const set = (key) => (e) => setF((s) => ({ ...s, [key]: e?.target ? e.target.value : e }));
    const toggle = (key, value) => { play('click'); setF((s) => ({ ...s, [key]: s[key].includes(value) ? s[key].filter((x) => x !== value) : [...s[key], value] })); };
    const addCustom = (e) => {
        e.preventDefault();
        const s = custom.trim();
        if (s && !f.skills.includes(s)) setF((x) => ({ ...x, skills: [...x.skills, s].slice(0, 12) }));
        setCustom('');
    };
    const go = (n) => { play('click'); setError(''); setStep(n); };
    const firstName = (f.name || me.user.name).split(' ')[0];
    const seeker = f.intent !== 'hire';

    /** Save a partial profile, then move on. */
    const save = async (body, next) => {
        setBusy(true);
        setError('');
        try {
            const res = await api('/profile/me', { method: 'PATCH', body });
            if (res.pointsAwarded) await celebrate({ awarded: res.pointsAwarded }, 'profile headline added');
            go(next);
        }
        catch (err) {
            setError(err.message);
            play('error');
        }
        finally {
            setBusy(false);
        }
    };

    const finish = async (to) => {
        setBusy(true);
        try {
            await api('/profile/me', { method: 'PATCH', body: { onboarded: true } });
            await refreshMe();
            play('success');
            if (to) navigate(to);
            // Give the next page a moment to render, then point out the navbar.
            setTimeout(startTour, to ? 900 : 300);
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
            setBusy(false);
        }
    };

    const jobsLink = (() => {
        const qs = new URLSearchParams();
        if (f.skills.length) qs.set('skills', f.skills.join(','));
        if (f.types.length) qs.set('type', f.types.join(','));
        if (f.modes.length) qs.set('workMode', f.modes.join(','));
        return `/jobs${qs.toString() ? `?${qs}` : ''}`;
    })();

    const Actions = ({ back, next, label = 'CONTINUE →', disabled }) => (
        <>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="onb-actions">
                {back !== undefined ? <button type="button" className="btn-ghost" onClick={() => go(back)}>← Back</button> : <span />}
                <button type="button" className="btn-primary" disabled={busy || disabled} onClick={next}>
                    <span className="btn-text">{busy ? 'SAVING…' : label}</span><div className="btn-bg"></div>
                </button>
            </div>
        </>
    );

    return (
        <div className="onb-overlay" role="presentation" data-lenis-prevent>
            <div className="onb" role="dialog" aria-modal="true" aria-labelledby="onb-title" tabIndex={-1} ref={dialogRef}
                onKeyDown={(e) => { if (e.key === 'Escape') finish(); }}>
                <div className="onb-top">
                    <ol className="onb-steps" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
                        {STEPS.map((label, i) => (
                            <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                                <span>{i < step ? '✓' : i + 1}</span>{label}
                            </li>
                        ))}
                    </ol>
                    <button type="button" className="onb-skip mono-text" onClick={() => finish()} disabled={busy}>Skip</button>
                </div>
                <div className="onb-bar" aria-hidden="true"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

                {step === 0 && (
                    <section>
                        <p className="page-eyebrow mono-text">// WELCOME ABOARD</p>
                        <h2 id="onb-title" className="onb-title">Hey {firstName} 👋 Let's set you up in <em>two minutes</em>.</h2>
                        <p className="onb-text">The Consistent Coders is a free job board run by students and early-career developers. Anyone can post a job, anyone can apply — and both earn points on a public leaderboard.</p>
                        <label className="field">
                            <span>What should we call you?</span>
                            <input value={f.name} onChange={set('name')} maxLength={80} autoComplete="name" required />
                        </label>
                        <div className="field">
                            <span>What brings you here?</span>
                            <div className="onb-choices" role="radiogroup" aria-label="What brings you here">
                                {INTENTS.map((o) => <Choice key={o.id} on={f.intent === o.id} onClick={() => { play('click'); set('intent')(o.id); }} {...o} />)}
                            </div>
                        </div>
                        <Actions next={() => save({ name: f.name, intent: f.intent }, 1)} disabled={!f.intent || !f.name.trim()} />
                    </section>
                )}

                {step === 1 && (
                    <section>
                        <p className="page-eyebrow mono-text">// ABOUT YOU · +1 POINT</p>
                        <h2 id="onb-title" className="onb-title">Tell posters who you are</h2>
                        <p className="onb-text">This appears next to every application you send and every job you post.</p>
                        <label className="field">
                            <span>Headline (+1 point)</span>
                            <input maxLength={120} placeholder="Final-year CS student · React & Node" value={f.headline} onChange={set('headline')} />
                        </label>
                        <div className="field">
                            <span>Experience</span>
                            <div className="onb-seg" role="radiogroup" aria-label="Experience">
                                {EXPERIENCE.map((o) => (
                                    <button key={o.id} type="button" role="radio" aria-checked={f.experience === o.id} className={f.experience === o.id ? 'is-on' : ''} onClick={() => { play('click'); set('experience')(o.id); }}>
                                        <b>{o.id}</b><small>{o.text}</small>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-grid">
                            <label className="field"><span>City</span><input maxLength={80} placeholder="Pune, Bengaluru, Remote…" value={f.city} onChange={set('city')} autoComplete="address-level2" /></label>
                            <label className="field"><span>{f.experience === 'Student' ? 'College' : 'College or company'}</span><input maxLength={120} placeholder={f.experience === 'Student' ? 'MIT-WPU' : 'Where you study or work'} value={f.org} onChange={set('org')} /></label>
                        </div>
                        <Actions back={0} next={() => save({ experience: f.experience, city: f.city, org: f.org, ...(f.headline.trim() ? { headline: f.headline } : {}) }, 2)} />
                    </section>
                )}

                {step === 2 && (
                    <section>
                        <p className="page-eyebrow mono-text">// SKILLS & PROOF OF WORK</p>
                        <h2 id="onb-title" className="onb-title">What can you build?</h2>
                        <p className="onb-text">Skills power your job recommendations. Links let posters see your work in one click.</p>
                        <div className="field">
                            <span>Skills (pick a few)</span>
                            <div className="pill-row onb-skills">
                                {[...new Set([...POPULAR_SKILLS, ...f.skills])].map((s) => (
                                    <button key={s} type="button" className={`pill onb-skill ${f.skills.includes(s) ? 'pill--accent' : ''}`} aria-pressed={f.skills.includes(s)} onClick={() => toggle('skills', s)}>
                                        {f.skills.includes(s) ? '✓ ' : '+ '}{s}
                                    </button>
                                ))}
                            </div>
                            <form className="onb-custom" onSubmit={addCustom}>
                                <input placeholder="Add another skill…" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Add a skill" />
                                <button type="submit" className="btn-ghost btn-sm">Add</button>
                            </form>
                        </div>
                        <div className="form-grid">
                            <label className="field"><span>GitHub</span><input type="url" placeholder="https://github.com/you" value={f.github} onChange={set('github')} /></label>
                            <label className="field"><span>LinkedIn</span><input type="url" placeholder="https://linkedin.com/in/you" value={f.linkedin} onChange={set('linkedin')} /></label>
                        </div>
                        <label className="field"><span>Portfolio / best project (optional)</span><input type="url" placeholder="https://your-project.vercel.app" value={f.portfolio} onChange={set('portfolio')} /></label>
                        <Actions back={1} next={() => save({ skills: f.skills, links: { github: f.github, linkedin: f.linkedin, portfolio: f.portfolio } }, 3)} />
                    </section>
                )}

                {step === 3 && (
                    <section>
                        <p className="page-eyebrow mono-text">// YOUR GOALS</p>
                        {seeker ? (
                            <>
                                <h2 id="onb-title" className="onb-title">What kind of role are you after?</h2>
                                <p className="onb-text">We'll use this to pick the jobs on your dashboard. Choose any that fit.</p>
                                <div className="field">
                                    <span>Job type</span>
                                    <div className="pill-row">{JOB_TYPES.map((t) => <button key={t} type="button" className={`pill onb-skill ${f.types.includes(t) ? 'pill--accent' : ''}`} aria-pressed={f.types.includes(t)} onClick={() => toggle('types', t)}>{f.types.includes(t) ? '✓ ' : ''}{t}</button>)}</div>
                                </div>
                                <div className="field">
                                    <span>Work mode</span>
                                    <div className="pill-row">{WORK_MODES.map((t) => <button key={t} type="button" className={`pill onb-skill ${f.modes.includes(t) ? 'pill--accent' : ''}`} aria-pressed={f.modes.includes(t)} onClick={() => toggle('modes', t)}>{f.modes.includes(t) ? '✓ ' : ''}{t}</button>)}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 id="onb-title" className="onb-title">Who are you hiring for?</h2>
                                <p className="onb-text">We'll pre-fill it on the post-a-job form. Posting for a friend's startup or a company you spotted? That's fine too.</p>
                                <label className="field"><span>Company or organisation</span><input maxLength={120} placeholder="Acme Labs" value={f.org} onChange={set('org')} /></label>
                            </>
                        )}
                        <div className="onb-tip">💡 {seeker ? 'Tip: applications with a GitHub or portfolio link get noticed first.' : 'Tip: listings with a salary range get about twice the applicants.'}</div>
                        <Actions back={2} next={() => save(seeker ? { prefs: { types: f.types, modes: f.modes } } : { org: f.org }, 4)} />
                    </section>
                )}

                {step === 4 && (
                    <section>
                        <p className="page-eyebrow mono-text">// PLATFORM OVERVIEW</p>
                        <h2 id="onb-title" className="onb-title">Everything you can do here</h2>
                        <div className="onb-platform">
                            {PLATFORM.map((p) => (
                                <div key={p.title} className="onb-feature">
                                    <span className="onb-feature-icon" aria-hidden="true">{p.icon}</span>
                                    <div>
                                        <strong>{p.title}</strong>
                                        <p>{p.text}</p>
                                        <small className="mono-text">{p.where}</small>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Actions back={3} next={() => go(5)} label="NEXT: POINTS →" />
                    </section>
                )}

                {step === 5 && (
                    <section>
                        <p className="page-eyebrow mono-text">// HOW THE GAME WORKS</p>
                        <h2 id="onb-title" className="onb-title">Four arenas. <em>Compete in all of them.</em></h2>
                        <div className="arena-rules onb-arenas">
                            {ARENAS.map((a) => (
                                <div key={a.id} className="arena-rule" style={{ '--arena': a.color }}>
                                    <h3><span aria-hidden="true">{a.icon}</span> {a.label}</h3>
                                    <ul>{a.earn.map((e) => <li key={e}>{e}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                        <p className="onb-text" style={{ marginTop: '1rem' }}>Each arena has 10 levels plus all-time and weekly leaderboards. Your total (plus +1 daily check-in) sets your overall rank:</p>
                        <div className="onb-ranks">
                            {[['Rookie', 0], ['Contributor', 5], ['Builder', 15], ['Architect', 40], ['Legend', 100]].map(([name, min], i) => (
                                <div key={name} className={`onb-rank ${i === 0 ? 'is-on' : ''}`}><b>{name}</b><span>{min}+ pts</span></div>
                            ))}
                        </div>
                        <div className="onb-badges">
                            {[['📖', 'First Lesson'], ['🎓', 'Path Complete'], ['🛠️', 'Shipper'], ['💚', 'Crowd Favourite'], ['📣', 'First Post'], ['🔎', 'Talent Scout'], ['🚀', 'First Application'], ['⭐', 'Shortlisted'], ['⚡', '3-Day Streak']].map(([i, l]) => <span key={l} className="badge-chip">{i} {l}</span>)}
                        </div>
                        <p className="onb-text onb-note">Fair play: nothing pays twice (same checkpoint, job, upvote or mission), you can't upvote your own project or apply to your own job.</p>
                        <Actions back={4} next={() => go(6)} label="GOT IT →" />
                    </section>
                )}

                {step === 6 && (
                    <section>
                        <p className="page-eyebrow mono-text">// YOUR FIRST MOVE</p>
                        <h2 id="onb-title" className="onb-title">You're all set, {firstName}. <em>Earn your next point.</em></h2>
                        <p className="onb-text">After this, we'll show you around the navbar in 20 seconds.</p>
                        <div className="onb-choices">
                            {seeker && (
                                <Choice role="button" on onClick={() => finish(jobsLink)} icon="🎯"
                                    title={f.skills.length || f.types.length ? 'See jobs picked for me' : 'Browse open jobs'}
                                    text="Apply to one → +1 point. Track its status from your dashboard." />
                            )}
                            {f.intent !== 'find' && (
                                <Choice role="button" on={f.intent === 'hire'} onClick={() => finish('/jobs/new')} icon="📣" title="Post my first job" text="Two-minute form. Goes live instantly and is indexed by Google. +1 point." />
                            )}
                            <Choice role="button" on={false} onClick={() => finish('/profile')} icon="🏠" title="Open my dashboard" text="Points, rank, badges, getting-started checklist and recommended jobs." />
                        </div>
                        <div className="onb-actions"><button type="button" className="btn-ghost" onClick={() => go(5)}>← Back</button><span /></div>
                    </section>
                )}
            </div>
        </div>
    );
};
