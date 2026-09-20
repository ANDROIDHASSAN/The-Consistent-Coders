import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { ArenaCards, BadgeCabinet, Heatmap } from '../components/Gamification';
import { apiFetch } from '../lib/api';
import { useGame } from '../context/GameContext';

const safe = (u) => (/^https:\/\//i.test(u || '') ? u : null);

export const MemberPage = () => {
    const { id } = useParams();
    const { me } = useGame();
    const [data, setData] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        let alive = true;
        apiFetch(`/profile/members/${id}`)
            .then((res) => { if (alive) { setData(res); setStatus('ready'); } })
            .catch((err) => { if (alive) setStatus(err.status === 404 ? 'missing' : 'error'); });
        return () => { alive = false; };
    }, [id]);

    const crumbs = [{ name: 'Leaderboard', path: '/leaderboard' }, { name: data?.member?.name ?? 'Member', path: `/members/${id}` }];

    if (status !== 'ready') {
        return (
            <>
                <Seo title="Member" description="Member profile on The Consistent Coders." path={`/members/${id}`} noindex />
                <div className="page"><div className="container">
                    <Breadcrumbs items={crumbs} />
                    {status === 'loading' ? <div className="skeleton" style={{ height: 300 }} /> : <><h1 className="page-title">Member not found</h1><p className="page-lede"><Link to="/leaderboard">Back to the leaderboard →</Link></p></>}
                </div></div>
                <Footer />
            </>
        );
    }

    const { member, standings, activity, learning, projects, allBadges } = data;
    const isMe = me?.user?.id === member.id;

    return (
        <>
            <Seo title={`${member.name} — ${member.rank.name} on The Consistent Coders`} description={`${member.name}: ${member.points} points across learning, building, hiring and applying. ${member.headline}`.trim()} path={`/members/${id}`} noindex />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head member-head">
                        <span className="avatar" style={{ width: 96, height: 96, margin: 0 }}>{member.picture ? <img src={member.picture} alt="" /> : member.name[0]}</span>
                        <div>
                            <p className="page-eyebrow mono-text">// {member.rank.name.toUpperCase()} · {member.points} PTS · {standings.all.all.position ? `#${standings.all.all.position} OVERALL` : 'UNRANKED'} · 🔥 {member.streak}-DAY STREAK</p>
                            <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', marginBottom: '0.3rem' }}>{member.name}</h1>
                            {member.headline && <p className="page-lede">{member.headline}</p>}
                            <p className="mono-text dash-meta">
                                {[member.experience, member.city, member.org].filter(Boolean).join(' · ')}
                                {safe(member.links.github) && <> · <a href={member.links.github} target="_blank" rel="noopener noreferrer nofollow">GitHub</a></>}
                                {safe(member.links.linkedin) && <> · <a href={member.links.linkedin} target="_blank" rel="noopener noreferrer nofollow">LinkedIn</a></>}
                                {safe(member.links.portfolio) && <> · <a href={member.links.portfolio} target="_blank" rel="noopener noreferrer nofollow">Portfolio</a></>}
                            </p>
                            {member.skills.length > 0 && <div className="pill-row" style={{ marginTop: '0.75rem' }}>{member.skills.map((s) => <span key={s} className="pill">{s}</span>)}</div>}
                            {isMe && <p style={{ marginTop: '1rem' }}><Link to="/profile" className="btn-ghost btn-sm">This is you — open dashboard</Link></p>}
                        </div>
                    </header>

                    <h2 className="h2">Arenas</h2>
                    <ArenaCards arenas={member.arenas} standings={standings} compact />

                    <section className="section-gap" aria-labelledby="m-activity">
                        <h2 id="m-activity" className="h2">Consistency</h2>
                        <Heatmap activity={activity} />
                    </section>

                    <section className="section-gap" aria-labelledby="m-badges">
                        <h2 id="m-badges" className="h2">Badges · {member.badges.length}/{allBadges.length}</h2>
                        <BadgeCabinet all={allBadges} earned={member.badges} />
                    </section>

                    {projects.length > 0 && (
                        <section className="section-gap" aria-labelledby="m-projects">
                            <h2 id="m-projects" className="h2">Projects</h2>
                            <div className="project-grid">
                                {projects.map((p) => (
                                    <article key={p.id} className="project-card">
                                        <h3>{p.title}</h3>
                                        <p className="project-desc">{p.description}</p>
                                        <footer>
                                            <div className="project-links">
                                                {safe(p.liveUrl) && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer nofollow">Live ↗</a>}
                                                {safe(p.repoUrl) && <a href={p.repoUrl} target="_blank" rel="noopener noreferrer nofollow">Code ↗</a>}
                                            </div>
                                            <span className="upvote is-on">▲ <b>{p.upvotes}</b></span>
                                        </footer>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {learning.length > 0 && (
                        <section className="section-gap" aria-labelledby="m-learning">
                            <h2 id="m-learning" className="h2">Learning paths</h2>
                            <div className="path-list">
                                {learning.map((p) => {
                                    const n = p.done.filter(Boolean).length;
                                    return (
                                        <div key={p.id} className="path-row">
                                            <span>{p.completed ? '🎓' : '📖'} {p.title}</span>
                                            <div className="arena-bar" style={{ '--arena': '#7cc4ff' }}><i style={{ width: `${(n / p.steps) * 100}%` }} /></div>
                                            <small className="mono-text">{n}/{p.steps}</small>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
                <Cta title={isMe ? 'Keep the streak alive.' : `Think you can beat ${member.name.split(' ')[0]}?`} text="Every checkpoint, project, job post and application is a point. Weekly boards reset every 7 days." primary={{ to: '/leaderboard', label: 'SEE LEADERBOARDS →' }} secondary={{ to: '/learn', label: 'START EARNING' }} />
            </div>
            <Footer />
        </>
    );
};
