import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SignInButton } from '@clerk/react';
import { Seo, jobPostingSchema } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { useApi } from '../lib/api';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';
import { InsiderPanel, QuestPanel } from '../components/JobQuest';
import { hasFullDescription } from '../content/jobSchema';
import { categoryBySlug, cityOf, jobHeadline, jobSummary, skillSlug, slugify } from '../content/jobCategories';

// Only http(s)/mailto links become clickable, whatever is stored.
const safeHref = (u) => (/^(https?:\/\/|mailto:)/i.test(u || '') ? u : null);

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export const JobDetailPage = () => {
    const { slug } = useParams();
    const api = useApi();
    const navigate = useNavigate();
    const { isSignedIn, isLoaded } = useSession();
    const { celebrate, toast, play, me } = useGame();
    const [job, setJob] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | missing | error
    const [applyForm, setApplyForm] = useState({ note: '', portfolioUrl: '' });
    const [busy, setBusy] = useState(false);
    const [applicants, setApplicants] = useState(null);

    useEffect(() => {
        if (!isLoaded) return;
        let alive = true;
        setStatus('loading');
        api(`/jobs/${slug}`)
            .then((res) => { if (alive) { setJob(res.job); setStatus('ready'); } })
            .catch((err) => { if (alive) setStatus(err.status === 404 ? 'missing' : 'error'); });
        return () => { alive = false; };
    }, [api, slug, isLoaded]);

    // Same-category open jobs: what a reader wants next, and internal links between job pages.
    const [related, setRelated] = useState([]);
    useEffect(() => {
        if (!job?.category) return;
        let alive = true;
        api(`/jobs?category=${job.category}&limit=6`)
            .then((res) => { if (alive) setRelated(res.items.filter((r) => r.slug !== job.slug).slice(0, 5)); })
            .catch(() => {});
        return () => { alive = false; };
    }, [api, job?.category, job?.slug]);

    const reloadJob = () =>api(`/jobs/${slug}`).then((res) => setJob(res.job)).catch(() => {});

    const canManage = job && (job.isOwner || me?.isAdmin);

    const loadApplicants = async () => {
        try {
            const res = await api(`/jobs/${job.id}/applicants`);
            setApplicants(res.applicants);
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
    };

    const submitApplication = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const res = await api(`/jobs/${job.id}/apply`, { method: 'POST', body: applyForm });
            setJob((j) => ({ ...j, hasApplied: true, applicantsCount: j.applicantsCount + (res.duplicate ? 0 : 1) }));
            if (res.duplicate) toast('You already applied to this job.', { kind: 'info' });
            else await celebrate(res.reward, 'application sent');
            if (safeHref(job.applyUrl)) window.open(job.applyUrl, '_blank', 'noopener');
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
        finally {
            setBusy(false);
        }
    };

    const setJobStatus = async (next) => {
        setBusy(true);
        try {
            const res = await api(`/jobs/${job.id}`, { method: 'PATCH', body: { status: next } });
            setJob(res.job);
            toast(next === 'closed' ? 'Job closed.' : 'Job reopened.', { kind: 'success', sound: 'click' });
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
        finally {
            setBusy(false);
        }
    };

    const removeJob = async () => {
        if (!window.confirm('Delete this job and all its applications? This cannot be undone.')) return;
        setBusy(true);
        try {
            await api(`/jobs/${job.id}`, { method: 'DELETE' });
            toast('Job deleted.', { kind: 'success' });
            navigate('/jobs');
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
            setBusy(false);
        }
    };

    const setAppStatus = async (applicationId, next) => {
        try {
            await api(`/jobs/${job.id}/applicants/${applicationId}`, { method: 'PATCH', body: { status: next } });
            setApplicants((list) => list.map((a) => (a.id === applicationId ? { ...a, status: next } : a)));
            play('click');
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
    };

    if (status === 'loading') {
        return <div className="page"><div className="container"><div className="skeleton" style={{ height: 320 }} /></div></div>;
    }
    if (status !== 'ready') {
        return (
            <>
                <Seo title="Job not found" description="This job is no longer listed." path={`/jobs/${slug}`} noindex />
                <div className="page"><div className="container">
                    <Breadcrumbs items={[{ name: 'Jobs', path: '/jobs' }, { name: 'Not found', path: `/jobs/${slug}` }]} />
                    <h1 className="page-title">This job is gone.</h1>
                    <p className="page-lede">{status === 'missing' ? 'It may have been filled or removed by the poster.' : 'Something went wrong loading it. Try again in a moment.'}</p>
                    <p style={{ marginTop: '2rem' }}><Link to="/jobs" className="btn-ghost">← Browse open jobs</Link></p>
                </div><Cta /></div>
                <Footer />
            </>
        );
    }

    const closed = job.status !== 'open';
    const cat = categoryBySlug(job.category);
    const crumbs = [{ name: 'Jobs', path: '/jobs' }, ...(cat ? [{ name: cat.name, path: `/jobs/category/${cat.slug}` }] : []), { name: job.title, path: `/jobs/${job.slug}` }];
    const seoTitle = jobHeadline(job);
    const city = cityOf(job.location);
    const companyPage = job.company !== 'Not available' ? `/jobs/company/${slugify(job.company)}` : '';
    const seoDesc = jobSummary(job);

    return (
        <>
            <Seo title={seoTitle} description={seoDesc} path={`/jobs/${job.slug}`} type="article" noindex={closed}
                jsonLd={closed || !hasFullDescription(job) ? [Breadcrumbs.schema(crumbs)] : [jobPostingSchema(job), Breadcrumbs.schema(crumbs)]} />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head">
                        <div className="pill-row" style={{ marginBottom: '1rem' }}>
                            <span className="pill pill--accent">{job.type}</span>
                            <span className="pill">{job.workMode}</span>
                            <span className="pill">{job.experience}</span>
                            {cat && <Link to={`/jobs/category/${cat.slug}`} className="pill">{cat.icon} More {cat.name} jobs</Link>}
                            {closed && <span className="pill pill--closed">Closed</span>}
                        </div>
                        <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.6rem)' }}>{job.title}</h1>
                        <p className="page-lede">
                            {job.companyUrl ? <a href={safeHref(job.companyUrl)} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'var(--color-white)' }}>{job.company}</a> : job.company}
                            {' · '}{job.location}{job.salary ? ` · ${job.salary}` : ''}
                        </p>
                    </header>

                    <div className="job-layout">
                        <article>
                            <h2 className="h2">About this role</h2>
                            <div className="prose">
                                {job.description.split(/\n{2,}|\n/).filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
                            </div>

                            {job.skills?.length > 0 && (
                                <>
                                    <h2 className="h2" style={{ marginTop: '2.5rem' }}>Skills</h2>
                                    <div className="pill-row">{job.skills.map((s) => (skillSlug(s) ? <Link key={s} to={`/jobs/skill/${skillSlug(s)}`} className="pill">{s}</Link> : <span key={s} className="pill">{s}</span>))}</div>
                                </>
                            )}

                            {!closed && (job.reachOut || job.reachOutCount > 0) && (
                                <section className="section-gap" aria-labelledby="reach-title">
                                    <h2 id="reach-title" className="h2">Reach the hiring team</h2>
                                    {job.reachOut ? (
                                        <div className="panel">
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                                                {job.reachOut.filter((r) => safeHref(r.href)).map((r) => (
                                                    <li key={r.href}>
                                                        <a href={r.href} target="_blank" rel="noopener noreferrer nofollow">{r.kind === 'email' ? '✉️' : r.kind === 'poster' ? '👤' : '🔎'} {r.label} ↗</a>
                                                        <small style={{ color: 'var(--muted)', display: 'block' }}>{r.note}</small>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p className="field-hint" style={{ marginTop: '1rem' }}>Keep it short: who you are, one line on why you fit, your GitHub or portfolio link.</p>
                                        </div>
                                    ) : CLERK_ENABLED && (
                                        <div className="panel">
                                            <p style={{ marginBottom: '1rem' }}>🔒 <strong>{job.reachOutCount} ways to reach the people hiring</strong>: the post author, emails from the post, and the founders and recruiters at {job.company}. Members only.</p>
                                            <SignInButton mode="modal"><button type="button" className="btn-primary"><span className="btn-text">SIGN IN TO UNLOCK</span><div className="btn-bg"></div></button></SignInButton>
                                        </div>
                                    )}
                                </section>
                            )}

                            {isSignedIn && !job.isOwner && (!closed || job.quest) && (
                                <section className="section-gap" aria-labelledby="quest-title">
                                    <h2 id="quest-title" className="h2">Your job quest</h2>
                                    <QuestPanel job={job} onChange={(quest) => setJob((j) => ({ ...j, quest }))} />
                                </section>
                            )}

                            {!closed && (isSignedIn ? (
                                <section className="section-gap" aria-labelledby="insider-title">
                                    <h2 id="insider-title" className="h2">Insiders at {job.company}</h2>
                                    <InsiderPanel job={job} me={me} onToggle={reloadJob} />
                                </section>
                            ) : job.insidersCount > 0 && (
                                <p className="page-lede section-gap">🤝 {job.insidersCount} member{job.insidersCount === 1 ? '' : 's'} at {job.company} can refer you. Sign in to see who.</p>
                            ))}

                            <section id="apply" className="section-gap" aria-labelledby="apply-title">
                                <h2 id="apply-title" className="h2">Apply for this job</h2>
                                {closed ? (
                                    <p className="page-lede">This role is closed. <Link to="/jobs">Browse other open jobs →</Link></p>
                                ) : job.hasApplied ? (
                                    <div className="panel">
                                        <p>✓ You have applied. Here's what happens next:</p>
                                        <ol className="next-steps">
                                            <li className="is-done"><b>Sent</b><span>The poster can see your note, link and headline.</span></li>
                                            <li><b>Viewed</b><span>When they open it, the status updates on your dashboard.</span></li>
                                            <li><b>Shortlisted</b><span>If you're a fit, they'll reach out by email.</span></li>
                                        </ol>
                                        <p style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <Link to="/profile" className="btn-ghost btn-sm">Track in dashboard</Link>
                                            <Link to={`/jobs?skills=${encodeURIComponent(job.skills.join(','))}`} className="btn-ghost btn-sm">Similar jobs (+1 pt each)</Link>
                                        </p>
                                        {job.applyUrl && <p style={{ marginTop: '0.75rem' }}><a href={safeHref(job.applyUrl)} target="_blank" rel="noopener noreferrer nofollow" className="btn-ghost btn-sm">Open external application ↗</a></p>}
                                    </div>
                                ) : !CLERK_ENABLED ? (
                                    <p className="page-lede">Sign-in is not configured yet.{job.applyUrl && <> Apply directly: <a href={safeHref(job.applyUrl)} target="_blank" rel="noopener noreferrer nofollow">{job.applyUrl}</a></>}</p>
                                ) : !isSignedIn ? (
                                    <div className="panel">
                                        <p style={{ marginBottom: '1rem' }}>Sign in to apply in one click — you get <strong style={{ color: 'var(--color-accent)' }}>+1 point</strong> for every application.</p>
                                        <SignInButton mode="modal"><button type="button" className="btn-primary"><span className="btn-text">SIGN IN TO APPLY</span><div className="btn-bg"></div></button></SignInButton>
                                    </div>
                                ) : job.isOwner ? (
                                    <p className="page-lede">You posted this job — you can manage it from the sidebar.</p>
                                ) : (
                                    <form className="panel" onSubmit={submitApplication}>
                                        <label className="field">
                                            <span>Portfolio / GitHub / LinkedIn (optional)</span>
                                            <input type="url" placeholder="https://github.com/you" value={applyForm.portfolioUrl} onChange={(e) => setApplyForm((f) => ({ ...f, portfolioUrl: e.target.value }))} />
                                        </label>
                                        <label className="field">
                                            <span>Short note to the poster (optional)</span>
                                            <textarea rows={4} maxLength={2000} placeholder="Why you're a fit, in 2–4 lines." value={applyForm.note} onChange={(e) => setApplyForm((f) => ({ ...f, note: e.target.value }))} />
                                        </label>
                                        <button type="submit" className="btn-primary" disabled={busy}>
                                            <span className="btn-text">{busy ? 'SENDING…' : job.applyUrl ? 'APPLY (+1 PT) & OPEN LINK ↗' : 'SEND APPLICATION (+1 PT)'}</span>
                                            <div className="btn-bg"></div>
                                        </button>
                                        {job.applyUrl && <p className="field-hint" style={{ marginTop: '0.75rem' }}>The poster asked applicants to also apply at their link; it opens after you submit.</p>}
                                    </form>
                                )}
                            </section>

                            {canManage && (
                                <section className="section-gap" aria-labelledby="applicants-title">
                                    <h2 id="applicants-title" className="h2">Applicants ({job.applicantsCount})</h2>
                                    {applicants === null ? (
                                        <button type="button" className="btn-ghost" onClick={loadApplicants}>Load applicants</button>
                                    ) : applicants.length === 0 ? (
                                        <p className="page-lede">No applications yet. Share the link: <code>{`${window.location.origin}/jobs/${job.slug}`}</code></p>
                                    ) : (
                                        <div className="table-wrap">
                                            <table className="table">
                                                <thead><tr><th>Candidate</th><th>Note</th><th>Link</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {applicants.map((a) => (
                                                        <tr key={a.id}>
                                                            <td>
                                                                <div className="lb-user">
                                                                    <span className="avatar avatar--sm">{a.applicant?.picture ? <img src={a.applicant.picture} alt="" /> : (a.applicant?.name?.[0] ?? '?')}</span>
                                                                    <div>
                                                                        <div>{a.applicant?.name ?? 'Deleted user'}</div>
                                                                        <small style={{ color: 'var(--muted)', display: 'block' }}>{a.applicant?.headline}</small>
                                                                        <small style={{ color: 'var(--muted)' }}>{[a.applicant?.experience, a.applicant?.city, a.applicant?.org].filter(Boolean).join(' · ')}{a.applicant ? ` · ${a.applicant.points} pts` : ''}</small>
                                                                        <small style={{ display: 'block' }}><a href={`mailto:${a.applicant?.email}`}>{a.applicant?.email}</a></small>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ maxWidth: 320, whiteSpace: 'pre-wrap' }}>{a.note || '—'}</td>
                                                            <td className="app-links">
                                                                {[['Link', a.portfolioUrl], ['GitHub', a.applicant?.links?.github], ['LinkedIn', a.applicant?.links?.linkedin], ['Portfolio', a.applicant?.links?.portfolio]]
                                                                      .filter(([, u]) => safeHref(u)).map(([l, u]) => <a key={l} href={u} target="_blank" rel="noopener noreferrer nofollow">{l} ↗</a>)}
                                                            </td>
                                                            <td>
                                                                <select className="mono-text" value={a.status} onChange={(e) => setAppStatus(a.id, e.target.value)} style={{ background: '#111', color: '#fff', border: '1px solid var(--line-strong)', borderRadius: 6, padding: '0.4rem' }}>
                                                                    {['sent', 'viewed', 'shortlisted', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>
                            )}
                        </article>

                        <aside className="job-aside" aria-label="Job details">
                            <div className="panel">
                                <h3>At a glance</h3>
                                <dl className="facts">
                                    <div><dt>Company</dt><dd>{companyPage ? <Link to={companyPage}>{job.company}</Link> : job.company}</dd></div>
                                    <div><dt>Type</dt><dd>{job.type}</dd></div>
                                    <div><dt>Mode</dt><dd>{job.workMode}</dd></div>
                                    <div><dt>Level</dt><dd>{job.experience}</dd></div>
                                    <div><dt>Location</dt><dd>{city ? <Link to={`/jobs/in/${city.slug}`}>{job.location}</Link> : job.location}</dd></div>
                                    {job.salary && <div><dt>Salary</dt><dd>{job.salary}</dd></div>}
                                    {job.deadline && <div><dt>Apply by</dt><dd><time dateTime={new Date(job.deadline).toISOString().slice(0, 10)}>{fmtDate(job.deadline)}</time></dd></div>}
                                    <div><dt>Posted</dt><dd><time dateTime={new Date(job.createdAt).toISOString().slice(0, 10)}>{fmtDate(job.createdAt)}</time></dd></div>
                                    <div><dt>Applicants</dt><dd>{job.applicantsCount}</dd></div>
                                    <div><dt>Views</dt><dd>{job.views}</dd></div>
                                </dl>
                                {!closed && !job.hasApplied && !job.isOwner && (
                                    <p style={{ marginTop: '1.25rem' }}><a href="#apply" className="btn-primary" style={{ width: '100%' }}><span className="btn-text">APPLY NOW →</span><div className="btn-bg"></div></a></p>
                                )}
                            </div>
                            <div className="panel">
                                <h3>Posted by</h3>
                                <div className="lb-user">
                                    <span className="avatar avatar--sm">{job.postedBy?.picture ? <img src={job.postedBy.picture} alt="" /> : (job.postedBy?.name?.[0] ?? '?')}</span>
                                    <span>{job.postedBy?.name ?? 'Community member'}</span>
                                </div>
                            </div>
                            {related.length > 0 && (
                                <nav className="panel" aria-label="Similar jobs">
                                    <h3>Similar jobs</h3>
                                    <ul className="related-jobs">
                                        {related.map((r) => <li key={r.slug}><Link to={`/jobs/${r.slug}`}>{jobHeadline(r)}</Link></li>)}
                                    </ul>
                                </nav>
                            )}
                            {canManage && (
                                <div className="panel">
                                    <h3>Manage</h3>
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        <Link to={`/jobs/${job.slug}/edit`} className="btn-ghost btn-sm">Edit job</Link>
                                        <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => setJobStatus(closed ? 'open' : 'closed')}>{closed ? 'Reopen job' : 'Mark as filled / close'}</button>
                                        <button type="button" className="btn-ghost btn-sm btn-danger" disabled={busy} onClick={removeJob}>Delete job</button>
                                    </div>
                                </div>
                            )}
                            <div className="panel">
                                <h3>Share</h3>
                                <button type="button" className="btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied', { kind: 'success', sound: 'click' }); }}>Copy link</button>
                            </div>
                        </aside>
                    </div>
                </div>
                <Cta title="Know about another opening? Post it in 2 minutes." text="Every job you post helps a fresher and earns you a point. Every application earns one too." primary={{ to: '/jobs/new', label: 'POST A JOB (+1 PT)' }} secondary={{ to: '/jobs', label: 'MORE JOBS →' }} />
            </div>
            <Footer />
        </>
    );
};
