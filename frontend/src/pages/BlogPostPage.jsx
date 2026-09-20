import { createElement } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Seo, articleSchema } from '../seo/Seo';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import { BLOG_POSTS, getPostBody, getPostMeta } from '../content/blog';
import { NotFoundPage } from './NotFoundPage';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export const BlogPostPage = () => {
    const { slug } = useParams();
    const post = getPostMeta(slug);
    const body = getPostBody(slug);
    if (!post || !body) return <NotFoundPage />;

    const sorted = [...BLOG_POSTS].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
    const idx = sorted.findIndex((p) => p.slug === slug);
    const prev = sorted[idx - 1];
    const next = sorted[idx + 1];
    const crumbs = [{ name: 'Blog', path: '/blog' }, { name: post.title, path: `/blog/${post.slug}` }];
    const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

    return (
        <>
            <Seo title={post.title} description={post.description} path={`/blog/${post.slug}`} type="article"
                jsonLd={[articleSchema(post), Breadcrumbs.schema(crumbs)]} />
            <div className="page">
                <article className="container--narrow">
                    <Breadcrumbs items={[crumbs[0], { name: post.category, path: `/blog/${post.slug}` }]} />
                    <header className="post-header">
                        <div className="post-meta" style={{ marginBottom: '1rem' }}>
                            <span>{post.category}</span><span>{post.readingTime} min read</span>
                            <span>Published {fmt(post.publishedAt)}</span>
                            {post.updatedAt !== post.publishedAt && <span>Updated {fmt(post.updatedAt)}</span>}
                        </div>
                        <h1 className="page-title">{post.title}</h1>
                        <p className="page-lede">{post.description}</p>
                    </header>
                    <div className="prose">
                        {createElement(body)}
                    </div>
                    <div className="pill-row" style={{ marginTop: '2rem' }}>{post.tags.map((t) => <span key={t} className="pill pill--muted">{t}</span>)}</div>
                    <nav className="post-nav" aria-label="More posts">
                        {prev ? <Link to={`/blog/${prev.slug}`}>← {prev.title}</Link> : <span />}
                        {next ? <Link to={`/blog/${next.slug}`} style={{ textAlign: 'right' }}>{next.title} →</Link> : <span />}
                    </nav>

                    <section className="section-gap" aria-labelledby="related">
                        <h2 id="related" className="h2">Keep reading</h2>
                        <div className="post-grid">
                            {related.map((p) => (
                                <Link key={p.slug} to={`/blog/${p.slug}`} className="post-card">
                                    <div className="post-meta"><span>{p.category}</span><span>{p.readingTime} min</span></div>
                                    <h3>{p.title}</h3>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="section-gap" aria-labelledby="ask">
                        <h2 id="ask" className="h2">Have a question about this?</h2>
                        <p className="page-lede" style={{ marginBottom: '1.5rem' }}>Ask it here — we answer every message and turn the good questions into new posts.</p>
                        <ContactForm compact subject={`Question about: ${post.title}`} />
                    </section>
                </article>
                <Cta />
            </div>
            <Footer />
        </>
    );
};
