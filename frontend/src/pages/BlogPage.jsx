import { Link } from 'react-router-dom';
import { Seo } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Footer } from '../components/Footer';
import { BLOG_POSTS } from '../content/blog/meta';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const BlogPage = () => {
    const crumbs = [{ name: 'Blog', path: '/blog' }];
    const posts = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return (
        <>
            <Seo
                title="Blog — Career Guides for Fresher Developers in India"
                description="Practical guides for students and fresher developers: getting your first job, portfolio projects, remote work, referrals, GitHub profiles, and writing job posts that work."
                path="/blog"
                jsonLd={Breadcrumbs.schema(crumbs)}
            />
            <div className="page">
                <div className="container">
                    <Breadcrumbs items={crumbs} />
                    <header className="page-head">
                        <p className="page-eyebrow mono-text">// BLOG</p>
                        <h1 className="page-title">Guides that get <em>freshers hired</em></h1>
                        <p className="page-lede">Short, specific, written by people who did it recently. No fluff, no "10 tips" lists — just the moves that work in the Indian dev job market right now.</p>
                    </header>
                    <div className="post-grid">
                        {posts.map((p) => (
                            <Link key={p.slug} to={`/blog/${p.slug}`} className="post-card">
                                <div className="post-meta"><span>{p.category}</span><span>{p.readingTime} min read</span><span>{fmt(p.publishedAt)}</span></div>
                                <h2>{p.title}</h2>
                                <p>{p.description}</p>
                                <span className="mono-text" style={{ color: 'var(--color-accent)', fontSize: '0.7rem', marginTop: 'auto' }}>READ →</span>
                            </Link>
                        ))}
                    </div>
                </div>
                <Cta title="Reading is step one. Applying is step two." text="The directory has open fresher roles right now. Every application earns you a point on the leaderboard." />
            </div>
            <Footer />
        </>
    );
};
