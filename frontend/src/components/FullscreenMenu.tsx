import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

interface FullscreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
  lenisRef: React.RefObject<any>;
}

export const FullscreenMenu: React.FC<FullscreenMenuProps> = ({ isOpen, onClose, lenisRef }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

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
    if (!menuTl) return;

    if (isOpen) {
      menuTl.timeScale(1).play();
      lenisRef.current?.stop();
    } else {
      menuTl.timeScale(1.4).reverse();
      lenisRef.current?.start();
    }
  }, [isOpen, lenisRef]);

  // Update counter on hover
  useEffect(() => {
    const menuItems = document.querySelectorAll('.menu-link');
    const counterEl = document.getElementById('menuCounter');

    const handleMouseEnter = (i: number) => () => {
      if (counterEl) {
        counterEl.textContent = `0${i + 1} / 0${menuItems.length}`;
      }
    };

    menuItems.forEach((link, i) => {
      link.addEventListener('mouseenter', handleMouseEnter(i));
    });

    return () => {
      menuItems.forEach((link, i) => {
        link.removeEventListener('mouseenter', handleMouseEnter(i));
      });
    };
  }, []);

  const handleLinkClick = () => {
    onClose();
    lenisRef.current?.start();
  };

  return (
    <div className={`fullscreen-menu ${isOpen ? 'is-active' : ''}`} id="fullscreenMenu" ref={menuRef}>
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
          {/* Temporarily disabled - Tasks section under development */}
          {/* <li className="menu-item">
            <Link to="/tasks" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="TASKS">
                  TASKS
                </span>
              </span>
            </Link>
          </li> */}
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
            <Link to="/join" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="JOIN MISSION">
                  JOIN MISSION
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
            <Link to="/contact" className="menu-link" onClick={handleLinkClick}>
              <span className="menu-link-inner">
                <span className="menu-link-text" data-text="CONTACT">
                  CONTACT
                </span>
              </span>
            </Link>
          </li>
        </ul>
        <div className="menu-footer mono-text">
          <span>// JOIN THE COMMUNITY</span>
          <br />
          <a href="mailto:consistentcoders@gmail.com" className="glitch-hover magnetic" data-strength="10">
            CONSISTENTCODERS@GMAIL.COM
          </a>
        </div>
        <div className="menu-social mono-text">
          <a href="#" className="menu-social-link">
            DC
          </a>
          <a href="#" className="menu-social-link">
            LI
          </a>
          <a href="#" className="menu-social-link">
            YT
          </a>
          <a href="#" className="menu-social-link">
            GH
          </a>
        </div>
        <div className="menu-counter mono-text" id="menuCounter">
          01 / 07
        </div>
      </div>
    </div>
  );
};
