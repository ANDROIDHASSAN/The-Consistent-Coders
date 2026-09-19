import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import structuredLearningImg from '../assets/images/howitworks/structuredlearning.webp';
import teamProjectsImg from '../assets/images/howitworks/teamprojects.webp';
import earnRecognitionImg from '../assets/images/howitworks/earnrecognition.webp';
import getHiredImg from '../assets/images/gethired/get hired.webp';
gsap.registerPlugin(ScrollTrigger);
export const HowItWorks = () => {
    const sectionRef = useRef(null);
    useEffect(() => {
        if (!sectionRef.current)
            return;
        const ctx = gsap.context(() => {
            const section = sectionRef.current;
            if (!section)
                return;
            // Reveal text
            const revealTexts = section.querySelectorAll('.hiw-title.reveal-text');
            revealTexts.forEach((el) => {
                const split = new SplitType(el, { types: 'words' });
                split.words?.forEach((word) => {
                    const wrapper = document.createElement('span');
                    wrapper.style.overflow = 'hidden';
                    wrapper.style.display = 'inline-block';
                    word.parentNode?.insertBefore(wrapper, word);
                    wrapper.appendChild(word);
                });
                gsap.fromTo(split.words, { y: '105%' }, {
                    y: '0%',
                    duration: 1.2,
                    stagger: 0.08,
                    ease: 'power4.out',
                    scrollTrigger: { trigger: el, start: 'top 85%' },
                });
            });
            // Reveal up
            const revealUps = section.querySelectorAll('.reveal-up');
            revealUps.forEach((el) => {
                gsap.to(el, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 88%' },
                });
            });
            // Reveal fade
            const revealFades = section.querySelectorAll('.reveal-fade');
            revealFades.forEach((el) => {
                gsap.fromTo(el, { y: 60, opacity: 0 }, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: el, start: 'top 85%' },
                });
            });
            // Cursor-following hover image effect
            const cursorFollowImg = document.getElementById('cursor-follow-img');
            const imgEl = cursorFollowImg?.querySelector('img');
            const cursorDot = document.getElementById('cursor-dot');
            const cursorRing = document.getElementById('cursor-ring');
            if (cursorFollowImg && imgEl) {
                const hiwRows = section.querySelectorAll('.hiw-row');
                const rowHandlers = [];
                hiwRows.forEach((row) => {
                    const bgImg = row.querySelector('.hiw-row-bg img');
                    const src = bgImg?.getAttribute('src') || '';
                    const alt = bgImg?.getAttribute('alt') || '';
                    const handleMouseEnter = () => {
                        if (!src)
                            return;
                        imgEl.setAttribute('src', src);
                        imgEl.setAttribute('alt', alt);
                        cursorFollowImg.classList.add('is-active');
                        if (cursorDot)
                            cursorDot.style.opacity = '0';
                        if (cursorRing)
                            cursorRing.style.opacity = '0';
                    };
                    const handleMouseLeave = () => {
                        cursorFollowImg.classList.remove('is-active');
                        if (cursorDot)
                            cursorDot.style.opacity = '';
                        if (cursorRing)
                            cursorRing.style.opacity = '';
                    };
                    rowHandlers.push({ row, handleMouseEnter, handleMouseLeave });
                    row.addEventListener('mouseenter', handleMouseEnter);
                    row.addEventListener('mouseleave', handleMouseLeave);
                });
                return () => {
                    rowHandlers.forEach(({ row, handleMouseEnter, handleMouseLeave }) => {
                        row.removeEventListener('mouseenter', handleMouseEnter);
                        row.removeEventListener('mouseleave', handleMouseLeave);
                    });
                };
            }
        }, sectionRef);
        return () => ctx.revert();
    }, []);
    return (<section className="section-how-it-works theme-black" id="how-it-works" ref={sectionRef}>
      <div className="hiw-header">
        <h2 className="hiw-title reveal-text">
          HOW IT <span className="text-italic serif-text">Works</span>
        </h2>
        <p className="hiw-subtitle mono-text reveal-up"> // The stages of the TCC ecosystem</p>
      </div>

      <div className="hiw-rows-container">
        <div className="hiw-row reveal-fade">
          <div className="hiw-row-bg">
            <img src={structuredLearningImg} alt="Structured learning paths for beginners" loading="lazy" decoding="async"/>
          </div>
          <div className="hiw-row-content">
            <h3 className="hiw-row-title">STRUCTURED LEARNING</h3>
            <div className="hiw-row-arrow">↗</div>
          </div>
        </div>

        <div className="hiw-row reveal-fade">
          <div className="hiw-row-bg">
            <img src={teamProjectsImg} alt="Developers building team projects together" loading="lazy" decoding="async"/>
          </div>
          <div className="hiw-row-content">
            <h3 className="hiw-row-title">TEAM PROJECTS</h3>
            <div className="hiw-row-arrow">↗</div>
          </div>
        </div>

        <div className="hiw-row reveal-fade">
          <div className="hiw-row-bg">
            <img src={earnRecognitionImg} alt="Earn recognition and leaderboard points" loading="lazy" decoding="async"/>
          </div>
          <div className="hiw-row-content">
            <h3 className="hiw-row-title">EARN RECOGNITION</h3>
            <div className="hiw-row-arrow">↗</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 5vw' }}>
        {/* Phase 4 */}
        <div className="phase-four reveal-fade">
          <div className="phase-four-inner">
            <div className="phase-four-content">
              <div className="phase-four-num mono-text"> // 04</div>
              <h3 className="phase-four-title">
                Get <span className="text-italic serif-text">Hired</span>
              </h3>
              <p className="phase-four-desc">
                Apply to our curated job board. Use your TCC project portfolio. Connect with our network of hiring
                managers and founders who trust TCC talent.
              </p>
              <Link to="/jobs" className="btn-primary" id="phase4Btn">
                <span className="btn-text">EXPLORE JOBS</span>
                <div className="btn-bg"></div>
              </Link>
            </div>
            <div className="phase-four-image">
              <img src={getHiredImg} alt="Get hired through the community job directory" className="phase-four-img" loading="lazy" decoding="async"/>
            </div>
          </div>
        </div>
      </div>
    </section>);
};
