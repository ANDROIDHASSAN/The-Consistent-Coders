import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Seo } from '../seo/Seo';
gsap.registerPlugin(ScrollTrigger);
import yashImg from '../assets/images/yash.webp';
import hassanImg from '../assets/images/hassan.png';
const TOP_CONTRIBUTORS = [
    {
        id: 'C-002',
        name: 'Hassan Kazi',
        role: 'Builder',
        specialty: 'Founder & Lead Builder',
        points: '9999 EXP',
        avatar: hassanImg,
        linkedin: 'https://www.linkedin.com/in/erhassankazi/',
        github: 'https://github.com/ANDROIDHASSAN'
    },
    {
        id: 'C-001',
        name: 'Yash Mahajan',
        role: 'Architect',
        specialty: 'Full Stack Development',
        points: '8500 EXP',
        avatar: yashImg,
        linkedin: 'https://www.linkedin.com/in/yash-mahajan-045380289/',
        github: 'https://github.com/yaassshhhhh'
    }
];
const WALL_OF_FAME = [
    { id: 'C-004', name: 'Join The Mission', role: 'Fresher', specialty: 'Frontend', points: '50 EXP', avatar: '+' },
    { id: 'C-005', name: 'Join The Mission', role: 'Fresher', specialty: 'Backend', points: '80 EXP', avatar: '+' }
];
export const ContributorsPage = () => {
    const pageRef = useRef(null);
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.honor-title span', { y: 100, opacity: 0, duration: 1.5, stagger: 0.1, ease: 'power4.out' });
            gsap.from('.honor-tag', { y: -20, opacity: 0, duration: 1, delay: 0.8 });
            gsap.fromTo('.contributor-main-card', { opacity: 0, scale: 0.95, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 1.2, delay: 0.4, ease: 'expo.out' });
            // 3D Card Tilt Interaction
            const cards = document.querySelectorAll('.contributor-main-card');
            const tiltHandlers = [];
            cards.forEach((card) => {
                const handleMouseMove = (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 25;
                    const rotateY = (centerX - x) / 25;
                    gsap.to(card, {
                        rotateX,
                        rotateY,
                        duration: 0.5,
                        ease: 'power2.out',
                        transformPerspective: 1000
                    });
                };
                const handleMouseLeave = () => {
                    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5 });
                };
                tiltHandlers.push({ card, handleMouseMove, handleMouseLeave });
                card.addEventListener('mousemove', handleMouseMove);
                card.addEventListener('mouseleave', handleMouseLeave);
            });
            return () => {
                tiltHandlers.forEach(({ card, handleMouseMove, handleMouseLeave }) => {
                    card.removeEventListener('mousemove', handleMouseMove);
                    card.removeEventListener('mouseleave', handleMouseLeave);
                });
            };
        }, pageRef);
        return () => ctx.revert();
    }, []);
    return (<>
      <Seo title="Honor Roll — Top Contributors" description="The people building The Consistent Coders: founders, architects and contributors ranked by EXP. See the live points leaderboard for job posters and applicants too." path="/contributors" jsonLd={Breadcrumbs.schema([{ name: 'Honor', path: '/contributors' }])} />
      <div ref={pageRef} className="contributors-page theme-black">
      {/* BACKGROUND DECOR */}
      <div className="bg-decor"></div>

      {/* HERO */}
      <section className="honor-hero">
         <Breadcrumbs items={[{ name: 'Honor', path: '/contributors' }]} />
         <h1 className="honor-title serif-text">
            <span style={{ display: 'inline-block' }}>Hall of </span> <br />
            <span className="accent-text italic-serif" style={{ display: 'inline-block' }}>Honor</span>
         </h1>
         <p className="mono-text hero-subtitle">RECOGNIZING THE ARCHITECTS OF THE ECOSYSTEM</p>
      </section>

      {/* FEATURED ARCHITECTS */}
      <section className="featured-section">
         <div className="contributors-grid">
            {TOP_CONTRIBUTORS.map((c) => (<div key={c.id} className="contributor-main-card">
                  {/* Tag */}
                  <div className="honor-tag">
                     PLATFORM ARCHITECT
                  </div>

                  <div className="card-content">
                     {/* Image Side */}
                     <div className="image-wrapper">
                        <div className="image-glow"></div>
                        <div className="image-container">
                           <img src={c.avatar} alt={c.name}/>
                        </div>
                     </div>

                     {/* Bio Side */}
                     <div className="bio-container">
                        <h2 className="serif-text bio-name">{c.name}</h2>
                        <p className="mono-text accent-text bio-specialty">{c.specialty.toUpperCase()}</p>
                        
                        <div className="stats-grid">
                           <div>
                              <p className="mono-text stat-label">RANK</p>
                              <p className="serif-text stat-value">{c.role}</p>
                           </div>
                           <div>
                              <p className="mono-text stat-label">REPUTATION</p>
                              <p className="serif-text accent-text stat-value">{c.points}</p>
                           </div>
                        </div>

                        {/* Social Links */}
                        <div className="social-links">
                           {c.github && <a href={c.github} target="_blank" rel="noopener noreferrer" className="mono-text social-link">GITHUB ↝</a>}
                           {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="mono-text social-link">LINKEDIN ↝</a>}
                        </div>
                     </div>
                  </div>
               </div>))}
         </div>
      </section>

      {/* WALL OF FAME */}
      <section className="wall-section">
         <div className="wall-container">
            <h3 className="serif-text wall-title">The Wall of Fame</h3>
            <div className="wall-grid">
               {WALL_OF_FAME.map(c => (<div key={c.id} className="wall-item">
                     <div className="wall-avatar">{c.name.charAt(0)}</div>
                     <div>
                        <h4 className="wall-name">{c.name}</h4>
                        <p className="wall-specialty">{c.specialty}</p>
                     </div>
                  </div>))}
            </div>

            <div className="cta-section">
               <h4 className="serif-text cta-title">Ready to be <span className="accent-text italic-serif">Honored?</span></h4>
               <Link to="/join" className="btn-primary btn-large">
                  <span className="btn-text">JOIN THE MISSION →</span>
                  <div className="btn-bg"></div>
               </Link>
            </div>
         </div>
      </section>

      <Cta title="Want your name here?" text="Points from posting and applying to jobs put you on the live leaderboard. Contributions to the platform put you on this wall." primary={{ to: '/leaderboard', label: 'LIVE LEADERBOARD →' }} secondary={{ to: '/tasks', label: 'OPEN MISSIONS' }} />
      <Footer />

      <style>{`
         .contributors-page {
            min-height: 100vh;
            padding-top: 160px;
            overflow-x: hidden;
            position: relative;
         }

         .bg-decor {
            position: fixed;
            top: 20%;
            right: -10%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(204,255,0,0.03) 0%, transparent 70%);
            z-index: 0;
            pointer-events: none;
         }

         .honor-hero {
            padding: 0 5vw 8rem;
            text-align: center;
            position: relative;
            z-index: 1;
         }

         .honor-title {
            font-size: clamp(3.5rem, 15vw, 12rem);
            line-height: 0.8;
            marginBottom: 2rem;
         }

         .hero-subtitle {
            font-size: 0.9rem;
            opacity: 0.4;
            letter-spacing: 0.1em;
         }

         .featured-section {
            padding: 0 5vw 12rem;
            display: flex;
            justify-content: center;
            position: relative;
            z-index: 2;
         }

         .contributors-grid {
            maxWidth: 1400px;
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(Min(100%, 600px), 1fr));
            gap: 3rem;
         }

         .contributor-main-card {
            background: rgba(255,255,255,0.015);
            backdrop-filter: blur(40px);
            border: 1px solid rgba(255,255,255,0.08);
            borderRadius: 40px;
            padding: clamp(2rem, 5vw, 5rem) clamp(1.5rem, 3.5vw, 3.5rem);
            position: relative;
            transition: box-shadow 0.5s ease, border-color 0.4s ease;
         }

         .contributor-main-card:hover { 
            box-shadow: 0 60px 120px rgba(0,0,0,0.8), 0 0 100px rgba(204,255,0,0.05); 
            border-color: rgba(204,255,0,0.2);
         }

         .honor-tag {
            position: absolute;
            top: -1.5rem;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-accent);
            color: var(--color-black);
            padding: 0.8rem 2.5rem;
            borderRadius: 100px;
            fontSize: 0.75rem;
            fontWeight: 950;
            letter-spacing: 0.2em;
            box-shadow: 0 20px 40px rgba(204,255,0,0.2);
            white-space: nowrap;
         }

         .card-content {
            display: flex;
            gap: 3rem;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
         }

         .image-wrapper {
            position: relative;
         }

         .image-glow {
            position: absolute;
            inset: -20px;
            background: radial-gradient(circle, rgba(204,255,0,0.1) 0%, transparent 70%);
            borderRadius: 50%;
            z-index: -1;
         }

         .image-container {
            width: 160px;
            height: 160px;
            borderRadius: 50%;
            border: 4px solid var(--color-accent);
            overflow: hidden;
            box-shadow: 0 0 60px rgba(204,255,0,0.1);
         }

         .image-container img {
            width: 100%;
            height: 100%;
            objectFit: cover;
         }

         .bio-container {
            textAlign: left;
            flex: 1;
            min-width: Min(100%, 250px);
         }

         .bio-name {
            font-size: clamp(1.8rem, 4vw, 2.5rem);
            line-height: 1;
            color: #fff;
            marginBottom: 0.5rem;
         }

         .bio-specialty {
            font-size: 0.85rem;
            marginBottom: 1.5rem;
            letter-spacing: 0.05em;
         }

         .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            borderTop: 1px solid rgba(255,255,255,0.08);
            paddingTop: 1.5rem;
         }

         .stat-label {
            font-size: 0.65rem;
            opacity: 0.4;
         }

         .stat-value {
            font-size: clamp(1.2rem, 3vw, 1.5rem);
            color: #fff;
         }

         .social-links {
            marginTop: 2.5rem;
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
         }

         .social-link {
            font-size: 0.7rem;
            color: #fff;
            opacity: 0.6;
            textDecoration: none;
            position: relative;
            transition: color 0.3s ease, opacity 0.3s ease;
         }

         .social-link::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: var(--color-accent);
            transition: width 0.4s var(--ease-out-expo);
         }

         .social-link:hover::after {
            width: 100%;
         }

         .social-link:hover {
            opacity: 1 !important;
            color: var(--color-accent) !important;
         }

         .wall-section {
            padding: 0 5vw 12rem;
            position: relative;
            z-index: 1;
         }

         .wall-container {
            maxWidth: 1200px;
            margin: 0 auto;
         }

         .wall-title {
            font-size: clamp(2rem, 5vw, 3rem);
            marginBottom: 4rem;
            opacity: 0.8;
         }

         .wall-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(Min(100%, 320px), 1fr));
            gap: 1.5rem;
         }

         .wall-item {
            background: rgba(255,255,255,0.02);
            border: 1px solid rgba(255,255,255,0.05);
            borderRadius: 24px;
            padding: 2rem;
            display: flex;
            alignItems: center;
            gap: 1.5rem;
            transition: all 0.4s ease;
         }

         .wall-item:hover { 
            transform: translateY(-5px); 
            border-color: rgba(204,255,0,0.2) !important; 
            background: rgba(204,255,0,0.02) !important; 
         }

         .wall-avatar {
            width: 60px;
            height: 60px;
            borderRadius: 50%;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            display: flex;
            alignItems: center;
            justify-content: center;
            fontSize: 1.4rem;
         }

         .wall-name {
            font-size: 1.2rem;
            fontWeight: 700;
         }

         .wall-specialty {
            font-size: 0.8rem;
            opacity: 0.4;
         }

         .cta-section {
            marginTop: 10rem;
            textAlign: center;
         }

         .cta-title {
            font-size: clamp(2rem, 8vw, 3.5rem);
            marginBottom: 2.5rem;
         }

         .italic-serif { font-family: var(--font-serif); font-style: italic; text-transform: none; }

         @media (max-width: 768px) {
            .contributors-page {
               padding-top: 100px;
            }
            .honor-hero {
               padding-bottom: 4rem;
            }
            .featured-section {
               padding-bottom: 6rem;
            }
            .wall-section {
               padding-bottom: 6rem;
            }
            .card-content {
               gap: 2rem;
            }
            .cta-section {
               margin-top: 6rem;
            }
            .honor-tag {
               padding: 0.6rem 1.5rem;
               font-size: 0.65rem;
            }
         }
      `}</style>
    </div>
    </>);
};
