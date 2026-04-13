import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './NavbarStyles.css';
import { useAuth } from '../context/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
// import tccLogo from '../assets/images/logo/favicon/the tcc.png';

gsap.registerPlugin(ScrollTrigger);

interface NavbarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle, isMenuOpen }) => {
  const navRef = useRef<HTMLElement>(null);
  // const brandRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, setShowLoginModal } = useAuth();

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
    { href: '/learn', label: 'Learn' },
    { href: '/build', label: 'Build' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/contributors', label: 'Honor' },
    { href: '/jobs', label: 'Jobs' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`} id="mainNav" ref={navRef}>
      <div className="nav-container">
        <div className="nav-center">
          {navLinks.map((link, index) => (
            <Link
              key={index}
              to={link.href}
              className={`nav-link ${location.pathname === link.href ? 'nav-link--active' : ''}`}
            >
              <span className="nav-link-text">{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-right">
          {!user ? (
            <>
              <button 
                className="nav-login-btn"
                onClick={() => setShowLoginModal(true)}
              >
                Login
              </button>
              <Link
                to="/join"
                className="nav-cta hidden-on-mobile"
                style={{ display: 'inline-block' }}
              >
                <span className="nav-cta-text">Join Mission</span>
                <div className="nav-cta-bg"></div>
              </Link>
            </>
          ) : (
            <ProfileDropdown />
          )}

          <div
            className={`hamburger ${isMenuOpen ? 'hamburger--active' : ''}`}
            onClick={onMenuToggle}
            role="button"
            tabIndex={0}
            aria-label="Toggle menu"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onMenuToggle();
              }
            }}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </div>
        </div>
      </div>
    </nav>
  );
};
