import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Seo, faqSchema } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { apiFetch } from '../lib/api';
import { useGame } from '../context/GameContext';

const TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'];
const MODES = ['Remote', 'Hybrid', 'On-site'];
const LEVELS = ['Fresher', 'Junior', 'Mid', 'Senior'];

const FAQS = [
    { q: 'Is it free to post a job on The Consistent Coders?', a: 'Yes. Anyone — a student, a founder, a recruiter or a random person who knows about an opening — can post a job for free. You earn 1 point on the leaderboard for every job you post.' },
    { q: 'Who can apply to jobs here?', a: 'Anyone with a free account. Applying earns you 1 point. Your application goes straight to the poster, and you can track its status from your dashboard.' },
    { q: 'What kinds of jobs are listed?', a: 'Developer jobs and internships for freshers and early-career engineers in India and remote: frontend, backend, full-stack, mobile, data, DevOps, design and more.' },
    { q: 'How do points and the leaderboard work?', a: 'Post a job: +1 point. Apply to a job: +1 point. Log in daily: +1 point. Complete your profile: +1 point. Points decide your rank — Rookie, Contributor, Builder, Architect, Legend — on the public leaderboard.' },
];

const daysAgo = (date) => {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`;
};

export const JobsPage = () => {
    const [params, setParams] = useSearchParams();
    const { play } = useGame();
    const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState(() => {
        try { return (typeof window !== 'undefined' && localStorage.getItem('tcc_jobs_view')) || 'cards'; } catch { return 'cards'; }
    });

    const filters = useMemo(() => ({
        q: params.get('q') || '',
        skills: params.get('skills') || '',
        type: params.get('type') || '',
        workMode: params.get('workMode') || '',
        experience: params.get('experience') || '',
        page: Number(params.get('page') || 1),
    }), [params]);

    useEffect(() => {
        let alive = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-filter-change
        setLoading(true);
        setError('');
        const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v && v !== 1).map(([k, v]) => [k, String(v)]));
        apiFetch(`/jobs?${qs}`)
            .then((res) => { if (alive) setData(res); })
            .catch((err) => { if (alive) setError(err.message); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [filters]);

    const setFilter = (key, value) => {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value); else next.delete(key);
        next.delete('page');
        setParams(next, { replace: true });
    };

    const switchView = (v) => {
        setView(v);
        play('click');
        try { localStorage.setItem('tcc_jobs_view', v); } catch { /* ignore */ }
    };

    const titleBits = [filters.workMode, filters.experience, filters.type].filter(Boolean).join(' ');
    const seoTitle = titleBits ? `${titleBits} Developer Jobs & Internships` : 'Developer Jobs & Internships for Freshers in India';
    const isFiltered = Boolean(filters.skills || filters.q || filters.type || filters.workMode || filters.experience || filters.page > 1);

    return (
        <>
            <Seo
                title={seoTitle}
                description="Browse free developer jobs and internships for students and freshers in India — remote, hybrid and on-site. Post a job or apply in one click and earn points on the community leaderboard."
                path="/jobs"
                noindex={isFiltered}
                jsonLd={[Breadcrumbs.schema([{ name: 'Jobs', path: '/jobs' }]), faqSchema(FAQS)]}
            />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={[{ name: 'Jobs', path: '/jobs' }]} />
                    <header className="page-head">
                        <p className="page-eyebrow mono-text">// JOB DIRECTORY</p>
                        <h1 className="page-title">Developer jobs &amp; internships, <em>posted by the community</em></h1>
                        <p className="page-lede">
                            A free job board for freshers and early-career developers in India. Anyone can post a role, anyone can apply — and every post or application earns a point on the <Link to="/leaderboard">leaderboard</Link>.
                        </p>
                    </header>

                    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
                        <label className="field">
                            <span>Search</span>
                            <input type="search" placeholder="Search title, company, skill or city…" value={filters.q} onChange={(e) => setFilter('q', e.target.value)} aria-label="Search jobs" />
                        </label>
                        <label className="field">
                            <span>Type</span>
                            <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} aria-label="Job type">
                                <option value="">All types</option>
                                {TYPES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Work mode</span>
                            <select value={filters.workMode} onChange={(e) => setFilter('workMode', e.target.value)} aria-label="Work mode">
                                <option value="">Any mode</option>
                                {MODES.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="field">
                            <span>Experience</span>
                            <select value={filters.experience} onChange={(e) => setFilter('experience', e.target.value)} aria-label="Experience level">
                                <option value="">Any level</option>
                                {LEVELS.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                    </form>

                    {filters.skills && (
                        <p className="match-chip mono-text">
                            MATCHING YOUR SKILLS: {filters.skills.split(',').join(' · ')}
                            <button type="button" aria-label="Clear skill filter" onClick={() => setFilter('skills', '')}>✕</button>
                        </p>
                    )}
                    <div className="filter-summary mono-text">
                        <span>{loading ? 'LOADING…' : `${data.total} OPEN ROLE${data.total === 1 ? '' : 'S'}`}</span>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <div className="view-toggle" role="group" aria-label="View">
                                <button type="button" aria-pressed={view === 'cards'} onClick={() => switchView('cards')}>CARDS</button>
                                <button type="button" aria-pressed={view === 'table'} onClick={() => switchView('table')}>TABLE</button>
                            </div>
                            <Link to="/jobs/new" className="btn-ghost btn-sm" onClick={() => play('click')}>+ POST A JOB</Link>
                        </div>
                    </div>

                    {error && <p className="form-error" role="alert">{error}</p>}

                    {loading ? (
                        <div className="job-grid">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" />)}</div>
                    ) : data.items.length === 0 ? (
                        <div className="empty">
                            <p>No open roles match these filters yet.</p>
                            <p style={{ marginTop: '1rem' }}><Link to="/jobs/new" className="btn-ghost">Be the first to post one (+1 pt)</Link></p>
                        </div>
                    ) : view === 'table' ? (
                        <div className="table-wrap">
                            <table className="table">
                                <caption>{data.total} open developer roles · updated live</caption>
                                <thead>
                                    <tr><th>Role</th><th>Company</th><th>Type</th><th>Mode</th><th>Level</th><th>Location</th><th>Salary</th><th className="num">Posted</th></tr>
                                </thead>
                                <tbody>
                                    {data.items.map((job) => (
                                        <tr key={job.id}>
                                            <td><Link to={`/jobs/${job.slug}`}>{job.title}</Link></td>
                                            <td>{job.company}</td>
                                            <td>{job.type}</td>
                                            <td>{job.workMode}</td>
                                            <td>{job.experience}</td>
                                            <td>{job.location}</td>
                                            <td>{job.salary || '—'}</td>
                                            <td className="num">{daysAgo(job.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="job-grid">
                            {data.items.map((job) => (
                                <Link key={job.id} to={`/jobs/${job.slug}`} className="job-item" onMouseEnter={() => play('hover')}>
                                    <div className="job-item-top">
                                        <span className="pill pill--accent">{job.type}</span>
                                        <span className="pill pill--muted">{job.workMode}</span>
                                    </div>
                                    <h2 className="job-item-title">{job.title}</h2>
                                    <div className="job-item-company">{job.company} · {job.location}</div>
                                    <div className="job-item-meta">
                                        <span>{job.experience}</span>
                                        {job.salary && <span>{job.salary}</span>}
                                        {job.deadline && <span>Apply by {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                                    </div>
                                    {job.skills?.length > 0 && (
                                        <div className="pill-row">{job.skills.slice(0, 4).map((s) => <span key={s} className="pill">{s}</span>)}</div>
                                    )}
                                    <div className="job-item-foot">
                                        <span>{daysAgo(job.createdAt)} · {job.applicantsCount} applicant{job.applicantsCount === 1 ? '' : 's'}</span>
                                        <strong>VIEW →</strong>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {data.pages > 1 && (
                        <nav className="pager" aria-label="Pagination">
                            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                                <button key={p} type="button" className="btn-ghost btn-sm" aria-current={p === data.page ? 'page' : undefined} style={p === data.page ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : undefined} onClick={() => { const n = new URLSearchParams(params); n.set('page', String(p)); setParams(n); }}>
                                    {p}
                                </button>
                            ))}
                        </nav>
                    )}

                    <section className="section-gap" aria-labelledby="faq-title">
                        <h2 id="faq-title" className="h2">Frequently asked questions</h2>
                        <div className="faq">
                            {FAQS.map((f) => (
                                <details key={f.q}>
                                    <summary>{f.q}</summary>
                                    <p>{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </section>
                </div>
                <Cta />
            </div>
            <Footer />
        </>
    );
};
