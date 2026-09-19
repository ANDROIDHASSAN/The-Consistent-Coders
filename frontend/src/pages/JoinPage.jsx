import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Seo } from '../seo/Seo';
gsap.registerPlugin(ScrollTrigger);
export const JoinPage = () => {
    const pageRef = useRef(null);
    const heroRef = useRef(null);
    useEffect(() => {
        if (!pageRef.current)
            return;
        const ctx = gsap.context(() => {
            // Hero Entrance
            gsap.from('.join-hero-title span', {
                y: 100,
                opacity: 0,
                duration: 1.2,
                stagger: 0.1,
                ease: 'power4.out',
                delay: 0.5
            });
            gsap.from('.join-hero-sub', {
                opacity: 0,
                y: 20,
                duration: 1,
                delay: 1.2,
                ease: 'power3.out'
            });
            // Section Reveals
            const revealSections = document.querySelectorAll('.reveal-section');
            revealSections.forEach((section) => {
                gsap.from(section.querySelectorAll('.reveal-item'), {
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                    },
                    y: 40,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.2,
                    ease: 'power3.out'
                });
            });
            // Magnetic Button
            const magneticBtns = document.querySelectorAll('.magnetic-btn');
            const magneticHandlers = [];
            magneticBtns.forEach((btn) => {
                const handleMouseMove = (e) => {
                    const rect = btn.getBoundingClientRect();
                    const x = (e.clientX - rect.left - rect.width / 2) * 0.4;
                    const y = (e.clientY - rect.top - rect.height / 2) * 0.4;
                    gsap.to(btn, { x, y, duration: 0.3 });
                };
                const handleMouseLeave = () => {
                    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
                };
                magneticHandlers.push({ btn, handleMouseMove, handleMouseLeave });
                btn.addEventListener('mousemove', handleMouseMove);
                btn.addEventListener('mouseleave', handleMouseLeave);
            });
            return () => {
                magneticHandlers.forEach(({ btn, handleMouseMove, handleMouseLeave }) => {
                    btn.removeEventListener('mousemove', handleMouseMove);
                    btn.removeEventListener('mouseleave', handleMouseLeave);
                });
            };
        }, pageRef);
        return () => ctx.revert();
    }, []);
    return (<>
      <Seo title="Join The Consistent Coders — Build Together, Get Hired" description="Join a free community of students and early-career developers in India. Take on missions, build in teams, post and apply to jobs, and climb the leaderboard." path="/join" jsonLd={Breadcrumbs.schema([{ name: 'Join', path: '/join' }])} />
      <div ref={pageRef} className="join-page">
      {/* SECTION: HERO */}
      <section ref={heroRef} className="section-hero join-hero theme-black" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 'clamp(140px, 22vh, 320px)',
            paddingBottom: '80px'
        }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Breadcrumbs items={[{ name: 'Join', path: '/join' }]} /></div>
          <h1 className="join-hero-title" style={{ fontSize: 'clamp(3.5rem, 10vw, 9rem)', lineHeight: '0.9', fontWeight: 900, marginBottom: 'clamp(2rem, 5vh, 4rem)' }}>
            <span style={{ display: 'inline-block' }}>BUILD</span> <br />
            <span style={{ display: 'inline-block' }} className="accent-text italic-serif">TOGETHER.</span> <br />
            <span style={{ display: 'inline-block' }}>GET HIRED.</span>
          </h1>
          <p className="join-hero-sub mono-text" style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto 3rem' }}>
            We're not just a community. We're an AI-Native ecosystem building the future of developer proof-of-work.
          </p>
          <div className="reveal-item" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            {/* Live Mission Marker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', opacity: 0.6 }} className="mono-text">
               <div className="pulse-dot" style={{ width: '8px', height: '8px', background: '#ccff00', borderRadius: '50%', boxShadow: '0 0 15px #ccff00' }}></div>
               <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>126 MISSIONS ACTIVE</span>
            </div>
            
            <Link to="/tasks" className="btn-primary btn-large magnetic-btn" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.5rem 3rem',
            fontSize: '1rem'
        }}>
              <span className="btn-text">VIEW OPEN MISSIONS &rarr;</span>
              <div className="btn-bg"></div>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION: WHY */}
      <section className="reveal-section theme-dark" style={{ padding: 'var(--section-pad) 2rem' }}>
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
            <div className="reveal-item">
              <h2 className="mono-text accent-text" style={{ marginBottom: '1.5rem' }}> // THE PROBLEM</h2>
              <p style={{ fontSize: '2rem', lineHeight: '1.3', fontWeight: 500 }}>
                Tutorial Hell is real. Coding in isolation is boring. Companies don't care about your certificates—they care about your contributions.
              </p>
            </div>
            <div className="reveal-item">
              <h2 className="mono-text accent-text" style={{ marginBottom: '1.5rem' }}> // THE SOLUTION</h2>
              <p style={{ fontSize: '2rem', lineHeight: '1.3', fontWeight: 500 }}>
                We build production-grade features <span className="italic-serif accent-text">live.</span> Join a mission, ship code, and let your work speak for itself during interviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: VIBE CODING */}
      <section className="reveal-section theme-black" style={{ padding: 'var(--section-pad) 2rem', overflow: 'hidden' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div className="reveal-item" style={{ marginBottom: '4rem' }}>
             <h2 className="serif-text" style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)', marginBottom: '1rem' }}>The Vibe Coding Revolution</h2>
             <p className="mono-text" style={{ color: 'var(--color-accent)' }}>Learn while building. Built with AI.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
             <div className="reveal-item vibe-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '3rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                <h3 className="mono-text" style={{ marginBottom: '1rem' }}>01. DESCRIBE</h3>
                <p style={{ opacity: 0.7 }}>Don't worry about syntax. Use AI to describe the logic you want to build for our platform.</p>
             </div>
             <div className="reveal-item vibe-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '3rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                <h3 className="mono-text" style={{ marginBottom: '1rem' }}>02. GENERATE</h3>
                <p style={{ opacity: 0.7 }}>Use tools like Antigravity to generate the boilerplate and core logic in seconds.</p>
             </div>
             <div className="reveal-item vibe-card" style={{ background: 'rgba(255,255,255,0.03)', padding: '3rem', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                <h3 className="mono-text" style={{ marginBottom: '1rem' }}>03. SHIP</h3>
                <p style={{ opacity: 0.7 }}>Understand, debug, and ship. You learn the stack by actually making it live.</p>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION: TIERS */}
      <section className="reveal-section theme-dark" style={{ padding: 'var(--section-pad) 2rem' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="reveal-item" style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', textAlign: 'center', marginBottom: '4rem' }}>For Everyone.</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="reveal-item tier-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
               <div>
                  <h3 className="serif-text" style={{ fontSize: '3rem' }}>The Fresher</h3>
                  <p className="mono-text">"I have zero knowledge."</p>
               </div>
               <p style={{ maxWidth: '400px', opacity: 0.8 }}>We give you starter tasks. Fix a button, write a tooltip, learn how GitHub works. We'll mentor you through PRs.</p>
            </div>
            
            <div className="reveal-item tier-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
               <div>
                  <h3 className="serif-text" style={{ fontSize: '3rem' }}>The Builder</h3>
                  <p className="mono-text">"I know React / Node."</p>
               </div>
               <p style={{ maxWidth: '400px', opacity: 0.8 }}>Build the Teams API, connect MongoDB, create the Leaderboard logic. Take ownership of core platform modules.</p>
            </div>
            
            <div className="reveal-item tier-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3rem' }}>
               <div>
                  <h3 className="serif-text" style={{ fontSize: '3rem' }}>The Architect</h3>
                  <p className="mono-text">"I want to lead."</p>
               </div>
               <p style={{ maxWidth: '400px', opacity: 0.8 }}>Review code, secure our pipeline, design shared components, and guide the community roadmap.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: CTA */}
      <section className="reveal-section theme-black" style={{ padding: 'var(--section-pad) 2rem', textAlign: 'center' }}>
         <div className="reveal-item">
            <h2 className="serif-text" style={{ fontSize: 'clamp(4rem, 10vw, 10rem)', lineHeight: '1', marginBottom: '3rem' }}>Ready to <span className="accent-text italic-serif">Commit?</span></h2>
            <Link to="/tasks" className="btn-primary btn-large" style={{ display: 'inline-block' }}>
              <span className="btn-text">EXPLORE THE ROADMAP →</span>
              <div className="btn-bg"></div>
            </Link>
         </div>
      </section>

      <Cta title="Joining takes one click. So does your first point." text="Sign in, post or apply to a job, and you're on the leaderboard." primary={{ to: '/jobs', label: 'BROWSE JOBS →' }} secondary={{ to: '/leaderboard', label: 'SEE LEADERBOARD' }} />
      <Footer />

      <style>{`
        .italic-serif {
          font-family: var(--font-serif);
          font-style: italic;
          text-transform: none;
        }
        .vibe-card:hover {
          border-color: var(--color-accent) !important;
          background: rgba(204, 255, 0, 0.05) !important;
          transform: translateY(-10px);
          transition: all 0.4s var(--ease-out-expo);
        }
        .tier-row {
          transition: background 0.3s ease;
        }
        .tier-row:hover {
          background: rgba(255,255,255,0.02);
        }
        @media (max-width: 768px) {
          .tier-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
    </>);
};
