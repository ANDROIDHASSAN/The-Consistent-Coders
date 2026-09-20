import { Link } from 'react-router-dom';
import { SignInButton } from '@clerk/react';
import { Seo, faqSchema } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';
import { ARENAS } from '../components/Gamification';

const CANDIDATE = [
    { title: 'Sign in with Google', text: 'One click. No forms, no fees. A 30-second welcome sets up your headline and skills.' },
    { title: 'Find a role', text: 'Search by skill, city, remote/hybrid, internship or full-time. Jobs matching your skills are highlighted on your dashboard.' },
    { title: 'Apply in one click', text: 'Add a portfolio link and a short note. The poster sees it with your headline. +1 point.' },
    { title: 'Track the status', text: 'Sent → Viewed → Shortlisted. Your dashboard updates as the poster reviews you.' },
    { title: 'Climb the leaderboard', text: 'Points from applying, posting and daily check-ins raise your rank from Rookie to Legend.' },
];
const POSTER = [
    { title: 'Know an opening? Paste it', text: 'Founder, recruiter, or a student who saw a role — anyone can post. Paste the WhatsApp text or LinkedIn link and the form fills itself. Check, publish. +1 point.' },
    { title: 'It goes live everywhere', text: 'Your listing gets its own page, is added to the sitemap and marked up as a Google job listing.' },
    { title: 'Review applicants', text: 'See each candidate with their note, portfolio link, headline and points. Shortlist or reject in one click.' },
    { title: 'Close when filled', text: 'Mark it filled and it leaves search results. You keep the points.' },
];
const FAQS = [
    { q: 'Is The Consistent Coders free?', a: 'Yes, completely. Posting jobs, applying and the leaderboard are free for everyone.' },
    { q: 'Who can post a job?', a: 'Anyone with an account — a startup founder, a recruiter, or a student who spotted an opening at a company. Every post earns 1 point.' },
    { q: 'What happens after I apply?', a: 'The poster sees your note, portfolio link and profile. They can mark your application as viewed, shortlisted or rejected, and you see that status on your dashboard. If the job has an external form, it opens right after you apply.' },
    { q: 'How do points work?', a: 'There are four arenas. Learning: +1 per checkpoint, +5 per finished path. Building: +3 per project, +1 per upvote received, +2 per mission. Hiring: +1 per job posted, +1 for its first applicant, +1 per applicant reviewed. Applying: +1 per application, +2 when shortlisted. Plus +1 daily check-in. Nothing pays twice.' },
    { q: 'What are ranks and badges?', a: 'Ranks come from total points: Rookie (0), Contributor (5), Builder (15), Architect (40), Legend (100). Badges unlock for milestones like your first post, first application, and 3- or 7-day streaks.' },
];

export const HowItWorksPage = () => {
    const { isSignedIn } = useSession();
    const { play } = useGame();
    const crumbs = [{ name: 'How it works', path: '/how-it-works' }];

    const start = isSignedIn || !CLERK_ENABLED
        ? <Link to="/jobs" className="btn-primary" onClick={() => play('click')}><span className="btn-text">BROWSE JOBS →</span><div className="btn-bg"></div></Link>
        : <SignInButton mode="modal"><button type="button" className="btn-primary" onClick={() => play('click')}><span className="btn-text">GET STARTED — FREE</span><div className="btn-bg"></div></button></SignInButton>;

    return (
        <>
            <Seo
                title="How It Works — Post Jobs, Apply and Earn Points"
                description="How The Consistent Coders works: sign in, find developer jobs and internships, apply in one click, track your status, post openings, review applicants and earn points on the leaderboard."
                path="/how-it-works"
                jsonLd={[Breadcrumbs.schema(crumbs), faqSchema(FAQS)]}
            />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head">
                        <p className="page-eyebrow mono-text">// START HERE</p>
                        <h1 className="page-title">How The Consistent Coders <em>works</em></h1>
                        <p className="page-lede">A free, community-run job board for students and early-career developers. Two ways to use it — find a job or share one — and both earn you points.</p>
                        <div className="cta-actions" style={{ marginTop: '2rem' }}>
                            {start}
                            <a href="#candidates" className="btn-ghost">I'M LOOKING FOR A JOB ↓</a>
                            <a href="#posters" className="btn-ghost">I WANT TO POST A JOB ↓</a>
                        </div>
                    </header>

                    <section id="candidates" className="section-gap hiw2" aria-labelledby="cand-title">
                        <p className="page-eyebrow mono-text">// FOR CANDIDATES</p>
                        <h2 id="cand-title" className="h2">From sign-in to shortlisted in five steps</h2>
                        <ol className="journey">
                            {CANDIDATE.map((s, i) => (
                                <li key={s.title} className="journey-step">
                                    <span className="journey-num">{String(i + 1).padStart(2, '0')}</span>
                                    <div><h3>{s.title}</h3><p>{s.text}</p></div>
                                </li>
                            ))}
                        </ol>
                        <div className="app-status" aria-label="Application status flow">
                            {['Sent', 'Viewed', 'Shortlisted'].map((s, i) => (
                                <div key={s} className="app-status-step"><span>{i + 1}</span>{s}</div>
                            ))}
                        </div>
                        <p style={{ marginTop: '1.5rem' }}><Link to="/blog/how-to-get-your-first-developer-job-in-india">Read: how to get your first developer job in India →</Link></p>
                    </section>

                    <section id="posters" className="section-gap" aria-labelledby="post-title">
                        <p className="page-eyebrow mono-text">// FOR JOB POSTERS</p>
                        <h2 id="post-title" className="h2">Share an opening in two minutes</h2>
                        <ol className="journey">
                            {POSTER.map((s, i) => (
                                <li key={s.title} className="journey-step">
                                    <span className="journey-num">{String(i + 1).padStart(2, '0')}</span>
                                    <div><h3>{s.title}</h3><p>{s.text}</p></div>
                                </li>
                            ))}
                        </ol>
                        <p style={{ marginTop: '1.5rem' }}><Link to="/jobs/new" className="btn-ghost">POST A JOB (+1 PT) →</Link></p>
                    </section>

                    <section className="section-gap" aria-labelledby="points-title">
                        <h2 id="points-title" className="h2">Points, ranks and badges</h2>
                        <p className="page-lede" style={{ marginBottom: '1rem' }}>Every action scores in one of four arenas. Each arena has 10 levels and its own all-time and weekly leaderboard.</p>
                        <div className="arena-rules">
                            {ARENAS.map((a) => (
                                <div key={a.id} className="arena-rule" style={{ '--arena': a.color }}>
                                    <h3><span aria-hidden="true">{a.icon}</span> {a.label}</h3>
                                    <ul>{a.earn.map((e) => <li key={e}>{e}</li>)}</ul>
                                    <Link to={a.to}>{a.cta} →</Link>
                                </div>
                            ))}
                        </div>
                        <p className="page-lede" style={{ marginTop: '1rem' }}>Plus +1 daily check-in and +1 for adding a profile headline. Nothing pays twice.</p>
                        <div className="onb-ranks" style={{ marginTop: '1.5rem' }}>
                            {[['Rookie', 0], ['Contributor', 5], ['Builder', 15], ['Architect', 40], ['Legend', 100]].map(([name, min]) => (
                                <div key={name} className="onb-rank"><b>{name}</b><span>{min}+ pts</span></div>
                            ))}
                        </div>
                        <p style={{ marginTop: '1.5rem' }}><Link to="/leaderboard">See the live leaderboard →</Link></p>
                    </section>

                    <section className="section-gap" aria-labelledby="hiw-faq">
                        <h2 id="hiw-faq" className="h2">Questions</h2>
                        <div className="faq">
                            {FAQS.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
                        </div>
                    </section>
                </div>
                <Cta />
            </div>
            <Footer />
        </>
    );
};
