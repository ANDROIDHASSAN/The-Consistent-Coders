import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignInButton } from '@clerk/react';
import { Seo } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { apiFetch, useApi } from '../lib/api';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';
import { startTour } from '../components/NavTour';
import { ArenaCards, BadgeCabinet, Heatmap } from '../components/Gamification';

const EVENT_LABELS = {
    job_posted: 'Posted a job',
    job_applied: 'Applied to a job',
    profile_completed: 'Completed profile',
    daily_login: 'Daily check-in',
    lesson_done: '📚 Learning checkpoint',
    path_done: '🎓 Finished a learning path',
    project_submitted: '🛠️ Shipped a project',
    upvote_received: '🛠️ Project upvoted',
    mission_done: '🛠️ Mission completed',
    first_applicant: '📣 First applicant on your job',
    applicant_reviewed: '📣 Reviewed an applicant',
    shortlisted: '🎯 Got shortlisted',
};

export const ProfilePage = () => {
    const api = useApi();
    const { isSignedIn, isLoaded } = useSession();
    const { me, refreshMe, celebrate, toast, play } = useGame();
    const [form, setForm] = useState({ name: '', headline: '', picture: '', skills: '', experience: '', city: '', org: '', github: '', linkedin: '', portfolio: '' });
    const [busy, setBusy] = useState(false);
    const [recommended, setRecommended] = useState(null);

    useEffect(() => {
        if (me?.user) {
            const u = me.user;
            setForm({ name: u.name, headline: u.headline, picture: u.picture, skills: u.skills.join(', '), experience: u.experience, city: u.city, org: u.org, github: u.links.github, linkedin: u.links.linkedin, portfolio: u.links.portfolio });
        }
    }, [me]);

    const skillKey = (me?.user?.skills || []).join(',');
    const typeKey = (me?.user?.prefs?.types || []).join(',');
    const modeKey = (me?.user?.prefs?.modes || []).join(',');
    useEffect(() => {
        if (!me?.user) return;
        const qs = new URLSearchParams({ limit: '4' });
        if (skillKey) qs.set('skills', skillKey);
        if (typeKey) qs.set('type', typeKey);
        if (modeKey) qs.set('workMode', modeKey);
        apiFetch(`/jobs?${qs}`).then((res) => setRecommended(res.items)).catch(() => setRecommended([]));
    }, [me?.user, skillKey, typeKey, modeKey]);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { github, linkedin, portfolio, ...rest } = form;
            const res = await api('/profile/me', { method: 'PATCH', body: { ...rest, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean), links: { github, linkedin, portfolio } } });
            if (res.pointsAwarded) await celebrate({ awarded: res.pointsAwarded }, 'profile completed');
            else { await refreshMe(); toast('Profile saved.', { kind: 'success', sound: 'success' }); }
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
        finally {
            setBusy(false);
        }
    };

    const closeJob = async (job) => {
        try {
            await api(`/jobs/${job.id}`, { method: 'PATCH', body: { status: job.status === 'open' ? 'closed' : 'open' } });
            await refreshMe();
            play('click');
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
    };

    const crumbs = [{ name: 'My dashboard', path: '/profile' }];
    const seo = <Seo title="My dashboard" description="Your points, rank, jobs and applications on The Consistent Coders." path="/profile" noindex />;

    if (!CLERK_ENABLED) {
        return <>{seo}<div className="page"><div className="container"><Breadcrumbs items={crumbs} /><h1 className="page-title">Your <em>dashboard</em></h1><p className="empty">Sign-in isn't configured yet (missing <code>VITE_CLERK_PUBLISHABLE_KEY</code>).</p></div><Cta /></div><Footer /></>;
    }
    if (!isLoaded || (isSignedIn && !me)) {
        return <>{seo}<div className="page"><div className="container"><div className="skeleton" style={{ height: 300 }} /></div></div></>;
    }
    if (!isSignedIn) {
        return (
            <>{seo}
                <div className="page"><div className="container">
                    <Breadcrumbs items={crumbs} />
                    <h1 className="page-title">Your <em>dashboard</em></h1>
                    <p className="page-lede" style={{ marginBottom: '2rem' }}>Sign in to see your points, rank, badges, posted jobs and applications.</p>
                    <SignInButton mode="modal"><button type="button" className="btn-primary"><span className="btn-text">SIGN IN</span><div className="btn-bg"></div></button></SignInButton>
                </div><Cta /></div>
                <Footer />
            </>
        );
    }

    const { user, jobs, applications, history, standings, activity, projects = [], allBadges = [] } = me;
    const checklist = (() => {
        const items = [
            { label: 'Add a headline', done: Boolean(user.headline), to: '#edit-profile', reward: '+1 pt' },
            { label: 'Add your skills', done: user.skills?.length > 0, to: '#edit-profile', reward: 'better matches' },
            { label: 'Link your GitHub or portfolio', done: Boolean(user.links.github || user.links.portfolio), to: '#edit-profile', reward: 'get noticed' },
            { label: 'Apply to your first job', done: user.applicationsSent > 0, to: '/jobs', reward: '+1 pt' },
            { label: 'Post a job you know about', done: user.jobsPosted > 0, to: '/jobs/new', reward: '+1 pt' },
            { label: 'Tick off your first learning checkpoint', done: user.stats.lessonsDone > 0, to: '/learn', reward: '+1 pt' },
            { label: 'Ship a project', done: user.stats.projectsSubmitted > 0, to: '/projects', reward: '+3 pts' },
            { label: 'Come back 3 days in a row', done: user.streak >= 3, to: '/leaderboard', reward: '⚡ badge' },
        ];
        return { items, done: items.filter((i) => i.done).length };
    })();
    const next = user.rank.next;
    const progress = next ? Math.min(100, Math.round((user.points / next.min) * 100)) : 100;

    return (
        <>{seo}
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="avatar" style={{ width: 80, height: 80, margin: 0 }}>{user.picture ? <img src={user.picture} alt="" /> : user.name[0]}</span>
                        <div>
                            <p className="page-eyebrow mono-text">// {user.rank.name.toUpperCase()} · {user.position ? `RANK #${user.position}` : 'UNRANKED'}</p>
                            <h1 className="page-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: '0.25rem' }}>{user.name}</h1>
                            <p style={{ color: 'var(--muted)' }}>{user.headline || 'Add a headline below (+1 point)'}</p>
                            <p className="mono-text dash-meta">
                                {[user.experience, user.city, user.org].filter(Boolean).join(' · ')}
                                {/^https:\/\//i.test(user.links.github) && <> · <a href={user.links.github} target="_blank" rel="noopener noreferrer">GitHub</a></>}
                                {/^https:\/\//i.test(user.links.linkedin) && <> · <a href={user.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></>}
                                {/^https:\/\//i.test(user.links.portfolio) && <> · <a href={user.links.portfolio} target="_blank" rel="noopener noreferrer">Portfolio</a></>}
                            </p>
                            <button type="button" className="btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => { play('click'); startTour(); }}>↺ Replay site tour</button>
                        </div>
                    </header>

                    {standings?.all?.all?.rival && (
                        <div className="lb-me-bar" style={{ marginBottom: '1.25rem' }}>
                            <span>⚔️ You're <b>{standings.all.all.rival.gap}</b> pt{standings.all.all.rival.gap === 1 ? '' : 's'} behind <Link to={`/members/${standings.all.all.rival.id}`}>{standings.all.all.rival.name}</Link> overall. One more action could do it.</span>
                            <Link to="/leaderboard" className="btn-ghost btn-sm">Leaderboards →</Link>
                        </div>
                    )}
                    <div className="stat-row">
                        <div className="stat"><b>{user.points}</b><span>Points</span></div>
                        <div className="stat"><b>{user.position ? `#${user.position}` : '—'}</b><span>Overall rank</span></div>
                        <div className="stat"><b>{standings?.all?.week?.score ?? 0}</b><span>Pts this week</span></div>
                        <div className="stat"><b>{user.jobsPosted}</b><span>Jobs posted</span></div>
                        <div className="stat"><b>{user.applicationsSent}</b><span>Applications</span></div>
                        <div className="stat"><b>{user.streak}🔥</b><span>Day streak</span></div>
                    </div>

                    <div className="panel" style={{ marginBottom: '2rem' }}>
                        <h3>Progress to {next ? next.name : 'max rank'}</h3>
                        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{next ? `${next.min - user.points} more point${next.min - user.points === 1 ? '' : 's'} to reach ${next.name}.` : 'You are a Legend. Nothing above this.'}</p>
                        {user.badges.length > 0 && (
                            <div className="badge-row" style={{ marginTop: '1rem' }}>{user.badges.map((b) => <span key={b.id} className="badge-chip">{b.icon} {b.label}</span>)}</div>
                        )}
                    </div>

                    {checklist.done < checklist.items.length && (
                        <section className="panel checklist" aria-labelledby="getting-started" style={{ marginBottom: '2rem' }}>
                            <h3 id="getting-started">Getting started · {checklist.done}/{checklist.items.length}</h3>
                            <div className="progress"><i style={{ width: `${(checklist.done / checklist.items.length) * 100}%` }} /></div>
                            <ul className="checklist-items">
                                {checklist.items.map((c) => (
                                    <li key={c.label} className={c.done ? 'is-done' : ''}>
                                        <span className="check" aria-hidden="true">{c.done ? '✓' : ''}</span>
                                        {c.done ? <span>{c.label}</span> : c.to.startsWith('#') ? <a href={c.to} onClick={() => play('click')}>{c.label}</a> : <Link to={c.to} onClick={() => play('click')}>{c.label}</Link>}
                                        <small>{c.reward}</small>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section aria-labelledby="arenas" style={{ marginBottom: '2rem' }}>
                        <h2 id="arenas" className="h2">Your arenas</h2>
                        <ArenaCards arenas={user.arenas} standings={standings} />
                    </section>

                    <section aria-labelledby="consistency" style={{ marginBottom: '2rem' }}>
                        <h2 id="consistency" className="h2">Consistency · 🔥 {user.streak}-day streak</h2>
                        <Heatmap activity={activity} />
                    </section>

                    <section aria-labelledby="badges" style={{ marginBottom: '2rem' }}>
                        <h2 id="badges" className="h2">Badge cabinet · {user.badges.length}/{allBadges.length}</h2>
                        <BadgeCabinet all={allBadges} earned={user.badges} />
                    </section>

                    <section aria-labelledby="for-you" style={{ marginBottom: '2rem' }}>
                        <h2 id="for-you" className="h2">{user.skills?.length ? 'Jobs matching your skills' : 'Latest jobs for you'}</h2>
                        {recommended === null ? <div className="skeleton" /> : recommended.length === 0 ? (
                            <p className="empty">No matches yet. <Link to="/jobs">Browse all jobs</Link> or add more skills below.</p>
                        ) : (
                            <div className="job-grid">
                                {recommended.map((j) => (
                                    <Link key={j.id} to={`/jobs/${j.slug}`} className="job-item">
                                        <div className="job-item-top"><span className="pill pill--accent">{j.type}</span><span className="pill pill--muted">{j.workMode}</span></div>
                                        <h3 className="job-item-title">{j.title}</h3>
                                        <div className="job-item-company">{j.company} · {j.location}</div>
                                        <div className="job-item-foot"><span>{j.salary || j.experience}</span><strong>APPLY +1 →</strong></div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <div className="dash-grid">
                        <section aria-labelledby="my-jobs">
                            <h2 id="my-jobs" className="h2">Jobs you posted <Link to="/jobs/new" className="btn-ghost btn-sm" style={{ marginLeft: '0.75rem', verticalAlign: 'middle' }}>+ New</Link></h2>
                            {jobs.length === 0 ? <p className="empty">No jobs yet. <Link to="/jobs/new">Post one (+1 pt)</Link></p> : (
                                <div className="list">
                                    {jobs.map((j) => (
                                        <div key={j.id} className="list-item">
                                            <div>
                                                <Link to={`/jobs/${j.slug}`}>{j.title}</Link>
                                                <div><small>{j.company} · {j.applicantsCount} applicant{j.applicantsCount === 1 ? '' : 's'} · {j.views} views · {j.status.toUpperCase()}</small></div>
                                            </div>
                                            <button type="button" className="btn-ghost btn-sm" onClick={() => closeJob(j)}>{j.status === 'open' ? 'Close' : 'Reopen'}</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section aria-labelledby="my-apps">
                            <h2 id="my-apps" className="h2">Your applications</h2>
                            {applications.length === 0 ? <p className="empty">No applications yet. <Link to="/jobs">Find a role (+1 pt)</Link></p> : (
                                <div className="list">
                                    {applications.map((a) => (
                                        <div key={a.id} className="list-item">
                                            <div>
                                                <Link to={`/jobs/${a.job.slug}`}>{a.job.title}</Link>
                                                <div><small>{a.job.company} · {new Date(a.createdAt).toLocaleDateString('en-IN')}</small></div>
                                            </div>
                                            <span className={`pill ${a.status === 'shortlisted' ? 'pill--accent' : a.status === 'rejected' ? 'pill--closed' : 'pill--muted'}`}>{a.status}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section aria-labelledby="edit-profile">
                            <h2 id="edit-profile" className="h2">Profile</h2>
                            <form className="panel" onSubmit={save}>
                                <label className="field"><span>Name</span><input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
                                <label className="field"><span>Headline (+1 pt the first time)</span><input maxLength={120} placeholder="Final-year CS student · React & Node" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} /></label>
                                <label className="field"><span>Skills (comma separated)</span><input placeholder="React, Node.js, SQL" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} /></label>
                                <div className="form-grid">
                                    <label className="field"><span>Experience</span><select value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}><option value="">—</option>{['Student', 'Fresher', 'Junior', 'Mid', 'Senior'].map((x) => <option key={x}>{x}</option>)}</select></label>
                                    <label className="field"><span>City</span><input maxLength={80} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></label>
                                </div>
                                <label className="field"><span>College or company</span><input maxLength={120} value={form.org} onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))} /></label>
                                <label className="field"><span>GitHub</span><input type="url" placeholder="https://github.com/you" value={form.github} onChange={(e) => setForm((f) => ({ ...f, github: e.target.value }))} /></label>
                                <label className="field"><span>LinkedIn</span><input type="url" placeholder="https://linkedin.com/in/you" value={form.linkedin} onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))} /></label>
                                <label className="field"><span>Portfolio</span><input type="url" placeholder="https://…" value={form.portfolio} onChange={(e) => setForm((f) => ({ ...f, portfolio: e.target.value }))} /></label>
                                <label className="field"><span>Photo URL</span><input type="url" placeholder="https://…" value={form.picture} onChange={(e) => setForm((f) => ({ ...f, picture: e.target.value }))} /></label>
                                <button type="submit" className="btn-primary" disabled={busy}><span className="btn-text">{busy ? 'SAVING…' : 'SAVE PROFILE'}</span><div className="btn-bg"></div></button>
                            </form>
                        </section>

                        <section aria-labelledby="my-projects">
                            <h2 id="my-projects" className="h2">Your projects <Link to="/projects" className="btn-ghost btn-sm" style={{ marginLeft: '0.75rem', verticalAlign: 'middle' }}>+ Ship</Link></h2>
                            {projects.length === 0 ? <p className="empty">No projects yet. <Link to="/projects">Ship one (+3 pts)</Link></p> : (
                                <div className="list">
                                    {projects.map((p) => (
                                        <div key={p.id} className="list-item">
                                            <span>{p.title}</span>
                                            <span className="upvote is-on">▲ <b>{p.upvotes}</b></span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p style={{ marginTop: '0.75rem' }}><Link to={`/members/${user.id}`} className="btn-ghost btn-sm">View my public profile →</Link></p>
                        </section>

                        <section aria-labelledby="history">
                            <h2 id="history" className="h2">Points history</h2>
                            {history.length === 0 ? <p className="empty">Nothing yet.</p> : (
                                <div className="list">
                                    {history.map((h, i) => (
                                        <div key={i} className="list-item">
                                            <span>{EVENT_LABELS[h.type] ?? h.type}{h.ref && !/^\d{4}-/.test(h.ref) && <small style={{ marginLeft: '0.5rem' }}>{h.ref}</small>}</span>
                                            <span style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>+{h.points}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
                <Cta />
            </div>
            <Footer />
        </>
    );
};
