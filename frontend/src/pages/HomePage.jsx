import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { LatestJobs } from '../components/LatestJobs';
import { Vision } from '../components/Vision';
import { Stats } from '../components/Stats';
import { HowItWorks } from '../components/HowItWorks';
import { Comparator } from '../components/Comparator';
import { Fame } from '../components/Fame';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { Seo, faqSchema, organizationSchema, websiteSchema } from '../seo/Seo';
import { BLOG_POSTS } from '../content/blog/meta';

const FAQS = [
    { q: 'What is The Consistent Coders?', a: 'A free, community-run job directory and learning ecosystem for students and early-career developers in India. Anyone can post a job, anyone can apply, and every action earns points on a public leaderboard.' },
    { q: 'Is it really free to post a job?', a: 'Yes. Posting is free for everyone — founders, recruiters, students who spotted an opening. Each post earns you 1 point.' },
    { q: 'How do I earn points?', a: 'Post a job (+1), apply to a job (+1), complete your profile (+1), and show up daily (+1). Points decide your rank from Rookie to Legend.' },
    { q: 'Do I need an account to browse jobs?', a: 'No. Browsing and reading are open to everyone. You only need a free account to post, apply, or appear on the leaderboard.' },
];

export const HomePage = () => (
    <>
        <Seo
            title="The Consistent Coders — Free Developer Job Directory for Freshers in India"
            description="Post and find developer jobs and internships for free. A gamified, community-run job directory for students and early-career engineers in India: every post and application earns points on the leaderboard."
            path="/"
            jsonLd={[organizationSchema(), websiteSchema(), faqSchema(FAQS)]}
        />
        <Hero />
        <LatestJobs />

        <section className="container" style={{ padding: 'var(--section-pad) 0 0' }} aria-labelledby="how-title">
            <p className="page-eyebrow mono-text">// HOW IT WORKS</p>
            <h2 id="how-title" className="h2">Three moves. One leaderboard.</h2>
            <div className="steps">
                <div className="step"><b>01 — POST</b><h3>Know an opening? List it.</h3><p>Two-minute form. Free. Indexed by Google as a job listing so candidates find it. <strong style={{ color: 'var(--color-accent)' }}>+1 point.</strong></p></div>
                <div className="step"><b>02 — APPLY</b><h3>See a fit? Apply in one click.</h3><p>Your note and portfolio go straight to the poster. Track status in your dashboard. <strong style={{ color: 'var(--color-accent)' }}>+1 point.</strong></p></div>
                <div className="step"><b>03 — CLIMB</b><h3>Points become rank.</h3><p>Rookie → Contributor → Builder → Architect → Legend. Badges for streaks and milestones. <Link to="/leaderboard">See the board →</Link></p></div>
            </div>
            <p style={{ marginTop: '1.5rem' }}><Link to="/how-it-works" className="btn-ghost">FULL WALKTHROUGH →</Link></p>
        </section>

        <Vision />
        <Stats />
        <HowItWorks />
        <Comparator />

        <section className="container" style={{ padding: 'var(--section-pad) 0 0' }} aria-labelledby="guides-title">
            <p className="page-eyebrow mono-text">// GUIDES</p>
            <h2 id="guides-title" className="h2">Read before you apply</h2>
            <div className="post-grid">
                {BLOG_POSTS.slice(0, 3).map((p) => (
                    <Link key={p.slug} to={`/blog/${p.slug}`} className="post-card">
                        <div className="post-meta"><span>{p.category}</span><span>{p.readingTime} min read</span></div>
                        <h3>{p.title}</h3>
                        <p>{p.description}</p>
                    </Link>
                ))}
            </div>
            <p style={{ marginTop: '1.5rem' }}><Link to="/blog" className="btn-ghost">ALL GUIDES →</Link></p>
        </section>

        <Fame />

        <section className="container" style={{ padding: 'var(--section-pad) 0 0' }} aria-labelledby="faq-home">
            <h2 id="faq-home" className="h2">Questions people ask</h2>
            <div className="faq">
                {FAQS.map((f) => (
                    <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
                ))}
            </div>
        </section>

        <Cta />
        <Footer />
    </>
);
