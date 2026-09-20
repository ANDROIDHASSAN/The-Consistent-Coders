import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import beforeTccImg from '../assets/images/before/after tcc/beforetcc.webp';
import afterTccImg from '../assets/images/before/after tcc/after tcc.webp';
gsap.registerPlugin(ScrollTrigger);
export const Comparator = () => {
    const afterWrapperRef = useRef(null);
    const handleRef = useRef(null);
    const textRef = useRef(null);
    const sectionRef = useRef(null);
    useLayoutEffect(() => {
        let ctx;
        // Small delay to ensure DOM is ready, avoiding race conditions with Barba
        const timer = setTimeout(() => {
            ctx = gsap.context(() => {
                if (!sectionRef.current)
                    return;
                const compTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top top',
                        end: '+=100%',
                        scrub: 1,
                        pin: true,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                });
                compTl
                    .fromTo(afterWrapperRef.current, { width: '0%' }, { width: '100%', ease: 'none', duration: 1 }, 0)
                    .fromTo(handleRef.current, { left: '0%' }, { left: '100%', ease: 'none', duration: 1 }, 0);
                // Text swap at midpoint
                if (textRef.current) {
                    gsap.set(textRef.current, { innerText: 'BEFORE TCC' });
                    compTl.set(textRef.current, { innerText: 'AFTER TCC' }, 0.5);
                    compTl.set(textRef.current, { innerText: 'BEFORE TCC' }, 0.49);
                }
                // Reveal fade
                gsap.utils.toArray('.comparator-inner.reveal-fade').forEach((el) => {
                    gsap.fromTo(el, { y: 60, opacity: 0 }, {
                        y: 0,
                        opacity: 1,
                        duration: 1,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            invalidateOnRefresh: true,
                        },
                    });
                });
                // Force refresh after setup
                ScrollTrigger.refresh();
            }, sectionRef);
        }, 200);
        return () => {
            clearTimeout(timer);
            if (ctx)
                ctx.revert();
        };
    }, []);
    return (<section className="section-comparator theme-dark" ref={sectionRef}>
      <div className="comparator-inner reveal-fade">
        <img src={beforeTccImg} className="comp-img comp-before" crossOrigin="anonymous" alt="A developer before joining The Consistent Coders" loading="lazy"/>
        <div className="comp-after-wrapper" ref={afterWrapperRef}>
          <img src={afterTccImg} className="comp-img comp-after" crossOrigin="anonymous" alt="A developer after joining The Consistent Coders" loading="lazy"/>
        </div>
        <div className="comp-handle" ref={handleRef}></div>
        <div className="comp-dynamic-text" id="compDynamicText" ref={textRef}>
          BEFORE TCC
        </div>
      </div>
      <p className="mono-text mt-2 text-center" style={{ opacity: 0.5 }}>
        // THE TRANSFORMATION
      </p>
    </section>);
};
