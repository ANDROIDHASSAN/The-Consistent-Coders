import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { beginnerTrack, intermediateTrack, advancedTrack, resourceFormats } from '../data/craftData.js';
gsap.registerPlugin(ScrollTrigger);
export const Craft = ({ onCardClick, progress }) => {
    const sectionRef = useRef(null);
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Reveal text animations
            const revealTextElements = document.querySelectorAll('.reveal-text');
            if (revealTextElements.length > 0) {
                revealTextElements.forEach((el) => {
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
            const revealUpElements = document.querySelectorAll('.reveal-up');
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
            // Card stagger animations
            const cardRows = document.querySelectorAll('.craft-cards-row');
            if (cardRows.length > 0) {
                cardRows.forEach((row) => {
                    const cards = row.querySelectorAll('.craft-card');
                    if (cards.length > 0) {
                        gsap.fromTo(cards, { y: 60, opacity: 0 }, {
                            y: 0,
                            opacity: 1,
                            duration: 0.9,
                            stagger: 0.09,
                            ease: 'power3.out',
                            scrollTrigger: { trigger: row, start: 'top 85%' },
                        });
                    }
                });
            }
            // Library pills stagger
            const libRows = document.querySelectorAll('.craft-libs-row');
            if (libRows.length > 0) {
                libRows.forEach((row) => {
                    const pills = row.querySelectorAll('.craft-lib-pill');
                    if (pills.length > 0) {
                        gsap.fromTo(pills, { y: 30, opacity: 0 }, {
                            y: 0,
                            opacity: 1,
                            duration: 0.6,
                            stagger: 0.07,
                            ease: 'power2.out',
                            scrollTrigger: { trigger: row, start: 'top 88%' },
                        });
                    }
                });
            }
        }, sectionRef);
        return () => ctx.revert();
    }, []);
    const renderCard = (card, isWide = false) => (<div key={card.id} className={`craft-card ${isWide ? 'craft-card--wide' : ''} reveal-fade`} id={card.id} data-tag={card.tag} data-title={card.title} data-desc={card.desc} data-libs={card.libs} data-pitfalls={JSON.stringify(card.pitfalls)} data-example={card.example} data-video={card.video || ''} onClick={() => onCardClick(card)}>
      <div className="craft-card-inner">
        <div className="craft-card-preview cc-preview-split">
          {card.title.split(' ')[0].split('').map((letter, i) => (<div key={i} className="cc-letter">
              {letter}
            </div>))}
        </div>
        <div className="craft-card-body">
          <h3 className="craft-card-title">
            {card.title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="accent-text">{card.title.split(' ').slice(-1)}</span>
          </h3>
          <p className="craft-card-desc mono-text">{card.libs.split(',').slice(0, 3).join(', ')}</p>
          <div className="craft-card-tag mono-text">{card.tag}</div>
          {progress?.[card.id] && (() => {
            const p = progress[card.id];
            const n = p.done.filter(Boolean).length;
            return (<div className={`craft-progress ${p.completed ? 'is-done' : ''}`} aria-label={`${n} of ${p.steps} checkpoints done`}>
                <div className="arena-bar" style={{ '--arena': '#7cc4ff' }}><i style={{ width: `${(n / p.steps) * 100}%` }}/></div>
                <span className="mono-text">{p.completed ? '🎓 COMPLETED' : `${n}/${p.steps} · +${p.steps - n + 5} PTS LEFT`}</span>
              </div>);
          })()}
        </div>
        <div className="craft-card-arrow">↗</div>
      </div>
    </div>);
    return (<section id="learn" className="section-craft theme-dark" ref={sectionRef}>
      <div className="craft-header">
        <div className="craft-label mono-text reveal-up"> // THE ROADMAP</div>
        <h2 className="craft-title reveal-text">
          YOUR <span className="text-italic serif-text">Learning</span> Path
        </h2>
        <p className="craft-subtitle reveal-up">
          Structured paths from zero to production — beginner, intermediate, and advanced tracks with curated
          resources.
        </p>
      </div>

      <div className="craft-categories">
        {/* BEGINNER TRACK */}
        <div className="craft-category">
          <div className="craft-category-label mono-text"> // BEGINNER TRACK — START HERE</div>
          <div className="craft-cards-row">{beginnerTrack.map((card) => renderCard(card))}</div>
        </div>

        {/* INTERMEDIATE TRACK */}
        <div className="craft-category">
          <div className="craft-category-label mono-text"> // INTERMEDIATE TRACK — BUILD THINGS</div>
          <div className="craft-cards-row">{intermediateTrack.map((card) => renderCard(card))}</div>
        </div>

        {/* ADVANCED TRACK */}
        <div className="craft-category">
          <div className="craft-category-label mono-text"> // ADVANCED TRACK — SPECIALIZE</div>
          <div className="craft-cards-row">{advancedTrack.map((card) => renderCard(card, true))}</div>
        </div>

        {/* RESOURCE TYPES */}
        <div className="craft-category">
          <div className="craft-category-label mono-text"> // RESOURCE FORMATS</div>
          <div className="craft-libs-row">
            {resourceFormats.map((format, index) => (<div key={index} className={`craft-lib-pill ${format.includes('New') ? 'craft-lib-pill--new' : ''} reveal-fade`}>
                <span className={`lib-dot ${format.includes('New') ? 'lib-dot--new' : ''}`}></span>
                {format}
              </div>))}
          </div>
        </div>
      </div>
    </section>);
};
