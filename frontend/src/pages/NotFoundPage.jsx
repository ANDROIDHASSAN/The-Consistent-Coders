import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Seo } from '../seo/Seo';
export const NotFoundPage = () => {
    const containerRef = useRef(null);
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.not-found-content', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
        }, containerRef);
        return () => ctx.revert();
    }, []);
    return (<><Seo title="Page not found" description="That page does not exist." path="/404" noindex />
    <div ref={containerRef} className="not-found-page" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center'
        }}>
      <div className="not-found-content">
        <h1 style={{
            fontSize: 'clamp(4rem, 15vw, 12rem)',
            fontWeight: 700,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #d4ff00 0%, #7fff00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
        }}>404</h1>
        <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            marginBottom: '1rem',
            fontWeight: 600
        }}>Page Not Found</h2>
        <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            marginBottom: '2rem',
            opacity: 0.8
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="magnetic" style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            backgroundColor: '#d4ff00',
            color: '#0e0e0e',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: 600,
            fontSize: '1.125rem',
            transition: 'all 0.3s ease'
        }}>
          Back to Home
        </Link>
        <p style={{ marginTop: '1.5rem' }}><Link to="/jobs" style={{ color: '#d4ff00' }}>Browse jobs →</Link></p>
      </div>
    </div></>);
};
