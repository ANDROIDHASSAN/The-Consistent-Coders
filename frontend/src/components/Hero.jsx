import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import heroBg from "../assets/faceboook1.png";
// import SplitType from 'split-type';
gsap.registerPlugin(ScrollTrigger);
export const Hero = () => {
  const heroRef = useRef(null);
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      // Hero entrance animation
      const heroSection = heroRef.current;
      if (!heroSection) return;
      const heroTl = gsap.timeline({ delay: 0.2 });
      const eyebrow = heroSection.querySelector(".hero-eyebrow");
      const splitLines = heroSection.querySelectorAll(".split-line");
      const cta = heroSection.querySelector(".hero-cta");
      if (heroSection) {
        heroTl.from(heroSection, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      }
      if (eyebrow) {
        heroTl.from(
          eyebrow,
          { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4",
        );
      }
      if (splitLines.length > 0) {
        heroTl.from(
          splitLines,
          {
            y: 200,
            opacity: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power4.out",
          },
          "-=0.5",
        );
      }
      // Subtext is always visible - no animation
      if (cta) {
        heroTl.from(
          cta,
          { y: 24, opacity: 0, duration: 0.5, ease: "power2.out" },
          "-=0.6",
        );
      }
      // Hero bg zoom parallax
      const bgImg = heroSection.querySelector(".hero-bg-parallax img");
      if (bgImg) {
        gsap.to(bgImg, {
          yPercent: 25,
          scale: 1.15,
          scrollTrigger: {
            trigger: heroSection,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
      // Variable font weight animation
      const titleEl = heroSection.querySelector(".hero-title");
      if (titleEl) {
        ScrollTrigger.create({
          trigger: heroSection,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          onUpdate: (self) => {
            const wght = 800 - self.progress * 400;
            titleEl.style.fontVariationSettings = `"wght" ${wght}`;
          },
        });
      }
      // Liquid filter hover
      const liquidEl = heroSection.querySelector(".liquid-hover");
      const disp = document.querySelector("#liquid-displacement");
      if (liquidEl && disp) {
        liquidEl.addEventListener("mouseenter", () =>
          gsap.to(disp, {
            attr: { scale: 60 },
            duration: 0.8,
            ease: "elastic.out(1, 0.3)",
          }),
        );
        liquidEl.addEventListener("mouseleave", () =>
          gsap.to(disp, {
            attr: { scale: 0 },
            duration: 0.5,
            ease: "power2.out",
          }),
        );
      }
    }, heroRef);
    return () => ctx.revert();
  }, []);
  return (
    <section id="home" className="section-hero theme-dark" ref={heroRef}>
      <div className="hero-bg-parallax">
        <img
          src={heroBg}
          alt=""
          className="zoom-img"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hero-vignette"></div>
      </div>

      <div className="hero-content">
        <div className="hero-eyebrow mono-text reveal-up">
          {" "}
          // FREE JOB DIRECTORY · EARN POINTS
        </div>
        <h1 className="hero-title variable-font">
          <div className="split-line">
            <span className="liquid-hover">THE</span>
          </div>
          <div className="split-line">
            <span className="text-italic serif-text">Consistent</span>{" "}
            <span className="accent-text">Coders</span>
          </div>
        </h1>
        <p className="hero-subtext scroll-typewrite mono-text">
          // Developer jobs & internships for freshers. Posted by the community.
        </p>
        <div className="hero-cta">
          <div className="magnetic-btn-wrapper magnetic" data-strength="60">
            <Link to="/jobs" className="btn-primary" id="discoverBtn">
              <span className="btn-text">BROWSE JOBS</span>
              <div className="btn-bg"></div>
            </Link>
          </div>
          <Link to="/jobs/new" className="btn-ghost">POST A JOB (+1 PT)</Link>
          <Link to="/how-it-works" className="hero-howto mono-text">NEW HERE? SEE HOW IT WORKS →</Link>
          <div
            className="hero-scroll-hint mono-text"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (window.lenis) {
                window.lenis.scrollTo(".section-vision", {
                  offset: 0,
                  duration: 1.5,
                  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                });
              } else {
                window.scrollTo({
                  top: window.innerHeight,
                  behavior: "smooth",
                });
              }
            }}
          >
            <div className="scroll-line"></div>
            SCROLL
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="hero-badges">
        <div className="hero-badge reveal-up" style={{ "--delay": "1.2s" }}>
          <span className="mono-text">MEMBERS</span>
          <span className="badge-value">500+</span>
        </div>
        <div className="hero-badge reveal-up" style={{ "--delay": "1.4s" }}>
          <span className="mono-text">JOBS</span>
          <span className="badge-value">FREE</span>
        </div>
      </div>
    </section>
  );
};
