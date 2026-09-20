import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { AuthButton } from './AuthButton';
import { useSession } from '../lib/auth';
export const FullscreenMenu = ({ isOpen, onClose, lenisRef }) => {
    const menuRef = useRef(null);
    const timelineRef = useRef(null);
    const { isSignedIn } = useSession();
    useEffect(() => {
        let ctx = gsap.context(() => {
            // Build menu timeline
            const menuTl = gsap.timeline({ paused: true });
            menuTl
                .to('.menu-bg', { y: '0%', duration: 0.7, ease: 'power4.inOut' })
                .to('.menu-link-text', { y: '0%', duration: 0.7, stagger: 0.08, ease: 'power3.out' }, '-=0.4')
                .to('.menu-footer', { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2')
                .to('.menu-social', { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3')
                .to('.menu-counter', { opacity: 1, duration: 0.3 }, '-=0.2');
            gsap.set('.menu-link-text', { y: '110%' });
            gsap.set('.menu-footer', { opacity: 0, y: 24 });
            gsap.set('.menu-social', { opacity: 0, x: 20 });
            gsap.set('.menu-counter', { opacity: 0 });
            timelineRef.current = menuTl;
        }, menuRef);
        return () => {
            ctx.revert();
        };
    }, []);
    useEffect(() => {
        const menuTl = timelineRef.current;
        if (!menuTl)
            return;
        if (isOpen) {
            menuTl.timeScale(1).play();
            lenisRef.current?.stop();
        }
        else {
            menuTl.timeScale(1.4).reverse();
            lenisRef.current?.start();
        }
    }, [isOpen, lenisRef]);
    // Update counter on hover
    useEffect(() => {
        const menuItems = document.querySelectorAll('.menu-link');
        const counterEl = document.getElementById('menuCounter');
        const listeners = [];
        const handleMouseEnter = (i) => () => {
            if (counterEl) {
                counterEl.textContent = `0${i + 1} / 0${menuItems.length}`;
            }
        };
        menuItems.forEach((link, i) => {
            const handler = handleMouseEnter(i);
            listeners.push({ link, handler });
            link.addEventListener('mouseenter', handler);
        });
        return () => {
            listeners.forEach(({ link, handler }) => {
                link.removeEventListener('mouseenter', handler);
            });
        };
    }, []);
    const handleLinkClick = () => {
        onClose();
        lenisRef.current?.start();
    };
    return (<div className={`fullscreen-menu ${isOpen ? 'is-active' : ''}`} id="fullscreenMenu" ref={menuRef}>
      <div className="menu-bg"></div>
      <div className="menu-inner">
        <ul className="menu-links">
          <li className="menu-item">
            <Link to="/" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="HOME">
                  HOME
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/how-it-works" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="START HERE">
                  START HERE
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/jobs" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="JOBS">
                  JOBS
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/jobs/new" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="POST A JOB">
                  POST A JOB
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/projects" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="PROJECTS">
                  PROJECTS
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/leaderboard" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="LEADERBOARD">
                  LEADERBOARD
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/blog" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="BLOG">
                  BLOG
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/learn" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="LEARN">
                  LEARN
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/build" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="BUILD">
                  BUILD
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/tasks" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="TASKS">
                  TASKS
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/contributors" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="HONOR">
                  HONOR
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            <Link to="/contact" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="CONTACT">
                  CONTACT
                </span>
              </span>
            </Link>
          </li>
          <li className="menu-item">
            {isSignedIn ? (<Link to="/profile" className="menu-link" onClick={handleLinkClick}>
                <span className="menu-link-inner">
                  <span className="menu-link-text" data-text="MY DASHBOARD">
                    MY DASHBOARD
                  </span>
                </span>
              </Link>) : (<div className="menu-link" style={{ pointerEvents: 'auto' }}>
                <AuthButton onNavigate={handleLinkClick} />
              </div>)}
          </li>
        </ul>
        <div className="menu-footer mono-text">
          <span> // JOIN THE COMMUNITY</span>
          <br />
          <a href="mailto:consistentcoders@gmail.com" className="glitch-hover magnetic" data-strength="10">
            CONSISTENTCODERS@GMAIL.COM
          </a>
        </div>
        <div className="menu-social mono-text">
          <a href="https://discord.gg/F7bWaYqf" className="menu-social-link" target="_blank" rel="noopener noreferrer">
            DC
          </a>
          <a href="https://www.linkedin.com/company/the-consistent-coders/" className="menu-social-link" target="_blank" rel="noopener noreferrer">
            LI
          </a>
          <a href="https://www.youtube.com" className="menu-social-link" target="_blank" rel="noopener noreferrer">
            YT
          </a>
          <a href="https://github.com/ANDROIDHASSAN" className="menu-social-link" target="_blank" rel="noopener noreferrer">
            GH
          </a>
        </div>
        <div className="menu-counter mono-text" id="menuCounter">
          01 / 13
        </div>
      </div>
    </div>);
};
