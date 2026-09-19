import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { fameData, leaderboardData } from '../data/fameData.js';
gsap.registerPlugin(ScrollTrigger);
export const Fame = () => {
    const sectionRef = useRef(null);
    useEffect(() => {
        let ctx;
        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            ctx = gsap.context(() => {
                // Reveal text
                const titleElements = document.querySelectorAll('.fame-title.reveal-text');
                if (titleElements.length > 0) {
                    titleElements.forEach((el) => {
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
                }
                // Reveal up
                const revealUpElements = gsap.utils.toArray('.section-fame .reveal-up');
                if (revealUpElements.length > 0) {
                    revealUpElements.forEach((el) => {
                        gsap.to(el, {
                            y: 0,
                            opacity: 1,
                            duration: 1,
                            ease: 'power3.out',
                            scrollTrigger: { trigger: el, start: 'top 88%' },
                        });
                    });
                }
                // Fame cards stagger
                const fameCards = document.querySelectorAll('.fame-grid .fame-card');
                if (fameCards.length > 0) {
                    gsap.fromTo(fameCards, { y: 50, opacity: 0 }, {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: '.fame-grid', start: 'top 85%' },
                    });
                }
                // Leaderboard bars animation
                const leaderboardBars = document.querySelectorAll('.lb-bar');
                if (leaderboardBars.length > 0) {
                    leaderboardBars.forEach((bar) => {
                        const fill = bar.querySelector('.lb-fill');
                        const scoreEl = bar.querySelector('.lb-score');
                        if (!fill || !scoreEl)
                            return;
                        const targetWidth = fill.getAttribute('data-width') + '%';
                        const targetScore = parseInt(scoreEl.getAttribute('data-score') || '0');
                        gsap.set(fill, { width: '0%' });
                        gsap.set(scoreEl, { textContent: '0 pts' });
                        const leaderboardStrip = document.querySelector('.leaderboard-strip');
                        if (leaderboardStrip) {
                            ScrollTrigger.create({
                                trigger: leaderboardStrip,
                                start: 'top 75%',
                                end: 'bottom 25%',
                                onEnter: () => {
                                    gsap.to(fill, { width: targetWidth, duration: 1.5, ease: 'power4.out' });
                                    gsap.to({ val: 0 }, {
                                        val: targetScore,
                                        duration: 1.5,
                                        ease: 'power4.out',
                                        onUpdate: function () {
                                            scoreEl.textContent = Math.round(this.targets()[0].val) + ' pts';
                                        },
                                    });
                                },
                                onLeaveBack: () => {
                                    gsap.to(fill, { width: '0%', duration: 1.5, ease: 'power4.out' });
                                    gsap.to({ val: targetScore }, {
                                        val: 0,
                                        duration: 1.5,
                                        ease: 'power4.out',
                                        onUpdate: function () {
                                            scoreEl.textContent = Math.round(this.targets()[0].val) + ' pts';
                                        },
                                    });
                                },
                            });
                        }
                    });
                }
                // Reveal fade
                const revealFadeElements = gsap.utils.toArray('.leaderboard-strip.reveal-fade');
                if (revealFadeElements.length > 0) {
                    revealFadeElements.forEach((el) => {
                        gsap.fromTo(el, { y: 60, opacity: 0 }, {
                            y: 0,
                            opacity: 1,
                            duration: 1,
                            ease: 'power3.out',
                            scrollTrigger: { trigger: el, start: 'top 85%' },
                        });
                    });
                }
            }, sectionRef);
        }, 100);
        return () => {
            clearTimeout(timer);
            if (ctx)
                ctx.revert();
        };
    }, []);
    const getStatsText = (stats) => {
        if (stats.sessions)
            return `${stats.sessions} sessions led`;
        if (stats.reviews)
            return `${stats.reviews} reviews given`;
        if (stats.resources)
            return `${stats.resources} resources added`;
        if (stats.prs)
            return `${stats.prs}+ PRs merged`;
        return '';
    };
    const getProjectsText = (stats) => {
        if (stats.projects)
            return `${stats.projects} projects ${stats.projects > 1 ? 'shipped' : 'shipped'}`;
        return '';
    };
    return (<section id="hall-of-fame" className="section-fame theme-dark" ref={sectionRef}>
      <div className="fame-header">
        <div className="fame-label mono-text reveal-up"> // RECOGNITION</div>
        <h2 className="fame-title reveal-text">
          HALL OF <span className="text-italic serif-text">Fame</span>
        </h2>
        <p className="fame-subtitle reveal-up">
          Members who go above and beyond — top contributors, project leaders, and community builders.
        </p>
      </div>

      <div className="fame-grid">
        {fameData.map((member) => (<div key={member.id} className="fame-card reveal-fade" id={member.id}>
            <div className="fame-rank mono-text">#{member.rank.toString().padStart(2, '0')}</div>
            <div className="fame-avatar">
              <img src={member.avatar} alt={member.name} loading="lazy" decoding="async"/>
              {member.crown && <div className="fame-crown">{member.crown}</div>}
            </div>
            <div className="fame-info">
              <h3 className="fame-name">{member.name}</h3>
              <div className="fame-role mono-text">{member.role}</div>
              <div className="fame-stats">
                <span>{getStatsText(member.stats)}</span>
                <span>•</span>
                <span>{getProjectsText(member.stats)}</span>
              </div>
              <div className="fame-badges">
                {member.badges.map((badge, index) => (<span key={index} className="fame-badge-tag">
                    {badge}
                  </span>))}
              </div>
            </div>
          </div>))}

        {/* Join CTA Card */}
        <div className="fame-card fame-card--join reveal-fade" id="fame-join">
          <div className="fame-info">
            <div className="fame-rank mono-text text-center"> // NEXT?</div>
            <h3 className="fame-name text-center">
              Could Be <span className="accent-text">You</span>
            </h3>
            <p className="fame-join-text">
              Consistent contributors get spotlighted every month. Show up, build things, help others — the community
              will notice.
            </p>
            <Link to="/contact" className="btn-primary" id="fameJoinBtn">
              <span className="btn-text">JOIN NOW</span>
              <div className="btn-bg"></div>
            </Link>
          </div>
        </div>
      </div>

      {/* Leaderboard mini */}
      <div className="leaderboard-strip reveal-fade">
        <div className="leaderboard-label mono-text"> // WEEKLY LEADERBOARD — CONTRIBUTIONS THIS WEEK</div>
        <div className="leaderboard-bars">
          {leaderboardData.map((entry, index) => (<div key={index} className="lb-bar">
              <span className="lb-name">{entry.name}</span>
              <div className="lb-track">
                <div className="lb-fill" data-width={entry.width}></div>
              </div>
              <span className="lb-score mono-text" data-score={entry.score}>
                0 pts
              </span>
            </div>))}
        </div>
      </div>
    </section>);
};
