import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { useAuth } from '../context/AuthContext';
import { jobsData } from '../data/jobsData';
import { createSplitType, revertSplitType, wrapWordsForReveal } from '../utils/splitTypeHelper';

gsap.registerPlugin(ScrollTrigger);

export const Jobs: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const splitInstancesRef = useRef<(SplitType | null)[]>([]);
  const { user, setShowLoginModal } = useAuth();

  useEffect(() => {
    let ctx: gsap.Context;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Reveal text
        const titleElements = document.querySelectorAll('.jobs-title.reveal-text');
        if (titleElements.length > 0) {
          titleElements.forEach((el) => {
            const split = createSplitType(el as HTMLElement, { types: 'words' } as any);
            if (split) {
              splitInstancesRef.current.push(split);
              wrapWordsForReveal(split.words ?? undefined);

              gsap.fromTo(
                split.words,
                { y: '105%' },
                {
                  y: '0%',
                  duration: 1.2,
                  stagger: 0.08,
                  ease: 'power4.out',
                  scrollTrigger: { trigger: el, start: 'top 85%' },
                }
              );
            }
          });
        }

        // Reveal up
        const revealUpElements = gsap.utils.toArray<HTMLElement>('.section-jobs .reveal-up');
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

        // Job cards stagger
        const jobCards = document.querySelectorAll('.jobs-grid .job-card');
        if (jobCards.length > 0) {
          gsap.fromTo(
            jobCards,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: '.jobs-grid', start: 'top 85%' },
            }
          );
        }
      }, sectionRef);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) ctx.revert();
      // Clean up on unmount
      splitInstancesRef.current.forEach(revertSplitType);
      splitInstancesRef.current = [];
    };
  }, []);

  return (
    <section id="jobs" className="section-jobs theme-black" ref={sectionRef}>
      <div className="jobs-header">
        <div className="jobs-label mono-text reveal-up">// OPPORTUNITIES</div>
        <h2 className="jobs-title reveal-text">
          JOBS & <span className="text-italic serif-text">Internships</span>
        </h2>
        <p className="jobs-subtitle reveal-up">
          Curated roles updated regularly. HR contacts. Application guidance. Real opportunities for TCC members.
        </p>
      </div>

      <div className="jobs-grid">
        {jobsData.map((job) => (
          <div key={job.id} className="job-card reveal-fade" id={job.id}>
            <div className="job-card-inner">
              <div className="job-header-row">
                <span className="job-type mono-text">// {job.type}</span>
                <span className={`job-badge ${job.badge === 'NEW' ? 'job-badge--new' : job.badge === 'HOT' ? 'job-badge--hot' : ''}`}>
                  {job.badge}
                </span>
              </div>
              <h3 className="job-role">{job.role}</h3>
              <div className="job-company">{job.company}</div>
              <div className="job-meta mono-text">
                <span>{job.meta.location}</span>
                {job.meta.duration && <span>{job.meta.duration}</span>}
                <span>{job.meta.salary}</span>
              </div>
              <div className="job-skills">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="job-footer">
                <span className="job-deadline mono-text">{job.deadline}</span>
                <a 
                  href={user ? job.applyLink : '#'} 
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault();
                      setShowLoginModal(true);
                    }
                  }}
                  target={user ? "_blank" : undefined}
                  rel={user ? "noopener noreferrer" : undefined}
                  className="job-apply-btn magnetic" 
                  data-strength="20"
                >
                  APPLY →
                </a>
              </div>
            </div>
          </div>
        ))}

        {/* CTA Card */}
        <div className="job-card job-card--cta reveal-fade" id="job-cta">
          <div className="job-card-inner">
            <div className="job-type mono-text">// GET GUIDANCE</div>
            <h3 className="job-role">Need help applying?</h3>
            <p className="job-guidance-text">
              Our members share HR contacts, referrals, cold email templates, and resume tips in our Discord. Join
              500+ members navigating their job search together.
            </p>
            <div className="job-footer">
              <Link to="/contact" className="btn-primary" id="jobGuidanceBtn">
                <span className="btn-text">JOIN DISCORD</span>
                <div className="btn-bg"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
