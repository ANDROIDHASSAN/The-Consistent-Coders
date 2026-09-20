import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthButton } from './AuthButton';
import { useGame } from '../context/GameContext';
import './NavbarStyles.css';
// import tccLogo from '../assets/images/logo/favicon/the tcc.png';
gsap.registerPlugin(ScrollTrigger);
export const Navbar = ({ onMenuToggle, isMenuOpen }) => {
    const navRef = useRef(null);
    // const brandRef = useRef<HTMLDivElement>(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const { soundOn, toggleSound } = useGame();
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Navbar entrance animation
            const navContainer = navRef.current?.querySelector('.nav-container');
            if (navContainer) {
                gsap.from(navContainer, {
                    y: -100,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out',
                    delay: 0.2,
                    clearProps: 'all',
                });
            }
            // Menu items stagger (only animate if they exist - desktop only)
            const navLinks = document.querySelectorAll('.nav-link');
            if (navLinks.length > 0 && window.innerWidth >= 1024) {
                gsap.from('.nav-link', {
                    opacity: 0,
                    y: -20,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    delay: 0.7,
                });
            }
            // Don't animate hamburger - it needs to be immediately visible on mobile
        }, navRef);
        return () => ctx.revert();
    }, []);
    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/how-it-works', label: 'Start here' },
        { href: '/jobs', label: 'Jobs' },
        { href: '/projects', label: 'Projects' },
        { href: '/leaderboard', label: 'Leaderboard' },
        { href: '/blog', label: 'Blog' },
        { href: '/learn', label: 'Learn' },
        { href: '/tasks', label: 'Tasks' },
    ];
    return (<nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`} id="mainNav" ref={navRef} aria-label="Primary">
      <div className="nav-container">
        <div className="nav-center">
          {navLinks.map((link, index) => (<Link key={index} to={link.href} className={`nav-link ${location.pathname === link.href ? 'nav-link--active' : ''}`} aria-current={location.pathname === link.href ? 'page' : undefined}>
              <span className="nav-link-text">{link.label}</span>
            </Link>))}
        </div>

        <div className="nav-right">
          <button type="button" className="sound-toggle" aria-pressed={soundOn} aria-label={soundOn ? 'Turn sounds off' : 'Turn sounds on'} title={soundOn ? 'Sounds on' : 'Sounds off'} onClick={toggleSound}>{soundOn ? '🔊' : '🔇'}</button>
          <div className="nav-cta" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <AuthButton />
          </div>

          <div className={`hamburger ${isMenuOpen ? 'hamburger--active' : ''}`} onClick={onMenuToggle} role="button" tabIndex={0} aria-label="Toggle menu" onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMenuToggle();
            }
        }}>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
        </div>
      </div>
    </nav>);
};
