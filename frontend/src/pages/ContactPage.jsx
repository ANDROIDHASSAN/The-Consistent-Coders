import React, { useEffect, useRef, useState } from 'react';
import { Footer } from '../components/Footer';
import { ContactForm } from '../components/ContactForm';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Seo } from '../seo/Seo';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSplitType, revertSplitType } from '../utils/splitTypeHelper';
gsap.registerPlugin(ScrollTrigger);
export const ContactPage = () => {
    const sectionRef = useRef(null);
    const [hoveredCard, setHoveredCard] = useState(null);
    const splitInstanceRef = useRef(null);
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero title animation
            const heroTitle = document.querySelector('.contact-hero-title');
            if (heroTitle) {
                const split = createSplitType(heroTitle, { types: 'chars' });
                splitInstanceRef.current = split;
                if (split?.chars) {
                    gsap.fromTo(split.chars, { y: 100, opacity: 0, rotateX: -90 }, {
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        duration: 1,
                        stagger: 0.03,
                        ease: 'power4.out',
                    });
                }
            }
            // Subtitle reveal
            gsap.fromTo('.contact-subtitle', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.5, ease: 'power3.out' });
            // Cards stagger animation
            gsap.fromTo('.contact-card', { y: 100, opacity: 0, scale: 0.8 }, {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.15,
                delay: 0.8,
                ease: 'back.out(1.7)',
            });
            // Form animation
            gsap.fromTo('.contact-form-wrapper', { x: 100, opacity: 0 }, {
                x: 0,
                opacity: 1,
                duration: 1,
                delay: 1.2,
                ease: 'power3.out',
            });
            // Floating animation for decorative elements
            gsap.to('.contact-float', {
                y: -20,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                stagger: 0.3,
            });
        }, sectionRef);
        return () => {
            revertSplitType(splitInstanceRef.current);
            splitInstanceRef.current = null;
            ctx.revert();
        };
    }, []);
    const contactMethods = [
        {
            icon: (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" fill="#C9FF2C"/>
        </svg>),
            title: 'Discord Community',
            description: 'Chat with 500+ devs, share code, get help',
            link: 'https://discord.gg/F7bWaYqf',
            label: 'JOIN DISCORD',
        },
        {
            icon: (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#C9FF2C"/>
        </svg>),
            title: 'WhatsApp Group',
            description: 'Daily updates, quick questions, announcements',
            link: 'https://chat.whatsapp.com/GGLUiPALqOYCPcCZK752Rv?mode=gi_t',
            label: 'JOIN WHATSAPP',
        },
        {
            icon: (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#C9FF2C"/>
        </svg>),
            title: 'LinkedIn',
            description: 'Connect for opportunities and updates',
            link: 'https://www.linkedin.com/company/the-consistent-coders/',
            label: 'CONNECT ON LINKEDIN',
        },
        {
            icon: (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="#C9FF2C"/>
        </svg>),
            title: 'GitHub',
            description: 'Check out our code and contribute',
            link: 'https://github.com/ANDROIDHASSAN',
            label: 'VIEW GITHUB',
        },
    ];
    const crumbs = [{ name: 'Contact', path: '/contact' }];
    return (<>
      <Seo title="Contact The Consistent Coders" description="Questions about a job listing, the leaderboard, or the community? Message us or join on Discord, WhatsApp, LinkedIn and GitHub. We reply within 48 hours." path="/contact" jsonLd={Breadcrumbs.schema(crumbs)} />
      <div className="contact-page" ref={sectionRef}>
        <div className="contact-hero">
          <div className="contact-decorative-bg">
            <div className="contact-float contact-circle-1"></div>
            <div className="contact-float contact-circle-2"></div>
            <div className="contact-float contact-circle-3"></div>
          </div>
          
          <div className="contact-hero-content">
            <Breadcrumbs items={crumbs} />
            <p className="contact-eyebrow mono-text"> // LET'S CONNECT</p>
            <h1 className="contact-hero-title">Get In Touch</h1>
            <p className="contact-subtitle">
              Got questions? Want to collaborate? Just wanna chat?
              <br />
              Hit us up on any platform below.
            </p>
          </div>
        </div>

        <div className="contact-main-content">
          <div className="contact-methods">
            {contactMethods.map((method, index) => (<a key={index} href={method.link} target="_blank" rel="noopener noreferrer" className="contact-card" onMouseEnter={() => setHoveredCard(index)} onMouseLeave={() => setHoveredCard(null)}>
                <div className="contact-card-icon">{method.icon}</div>
                <h3 className="contact-card-title">{method.title}</h3>
                <p className="contact-card-description">{method.description}</p>
                <span className="contact-card-link mono-text">
                  {method.label} →
                </span>
                <div className="contact-card-bg" style={{
                transform: hoveredCard === index ? 'scale(1)' : 'scale(0)',
            }}></div>
              </a>))}
          </div>

          <div className="contact-form-wrapper">
            <div className="contact-form-header">
              <h2 className="contact-form-title">Send us a message</h2>
              <p className="contact-form-subtitle mono-text">
                // We usually reply within 48 hours
              </p>
            </div>

            <ContactForm />
          </div>
        </div>
      </div>
      <Cta title="Rather post the question as a job?" text="If you're hiring or know an opening, list it — it's free and reaches the whole community." primary={{ to: '/jobs/new', label: 'POST A JOB (+1 PT)' }} secondary={{ to: '/jobs', label: 'BROWSE JOBS' }} />

      <Footer minimal/>
    </>);
};
