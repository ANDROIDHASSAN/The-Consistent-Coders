import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
export const CustomCursor = () => {
    const cursorDotRef = useRef(null);
    const cursorRingRef = useRef(null);
    const cursorFollowImgRef = useRef(null);
    useEffect(() => {
        // Don't render custom cursor on mobile/tablet devices
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isMobile = window.innerWidth < 1024;
        if (isTouchDevice || isMobile) {
            return;
        }
        const cursorDot = cursorDotRef.current;
        const cursorRing = cursorRingRef.current;
        const cursorFollowImg = cursorFollowImgRef.current;
        if (!cursorDot || !cursorRing)
            return;
        const ctx = gsap.context(() => {
            // GSAP quickTo for near-zero-lag tracking
            const xDot = gsap.quickTo(cursorDot, 'x', { duration: 0.05, ease: 'power3' });
            const yDot = gsap.quickTo(cursorDot, 'y', { duration: 0.05, ease: 'power3' });
            const xRing = gsap.quickTo(cursorRing, 'x', { duration: 0.25, ease: 'power3' });
            const yRing = gsap.quickTo(cursorRing, 'y', { duration: 0.25, ease: 'power3' });
            let xImg;
            let yImg;
            if (cursorFollowImg) {
                xImg = gsap.quickTo(cursorFollowImg, 'x', { duration: 0.1, ease: 'power2' });
                yImg = gsap.quickTo(cursorFollowImg, 'y', { duration: 0.1, ease: 'power2' });
            }
            const handleMouseMove = (e) => {
                xDot(e.clientX);
                yDot(e.clientY);
                xRing(e.clientX);
                yRing(e.clientY);
                if (xImg)
                    xImg(e.clientX);
                if (yImg)
                    yImg(e.clientY);
            };
            const handleMouseDown = () => cursorDot.classList.add('clicking');
            const handleMouseUp = () => cursorDot.classList.remove('clicking');
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mouseup', handleMouseUp);
            // Hover state via delegation: works for elements on every page, including ones added later.
            const hoverTargets = 'a, button, [role=button], .btn-primary, .magnetic, .craft-card, .work-item, .footer-email, .menu-link, [data-cursor-text], summary, select, label';
            const cTextEl = document.getElementById('cursor-text');
            let current = null;
            const handleOver = (e) => {
                const el = e.target.closest?.(hoverTargets) ?? null;
                if (el === current) return;
                current = el;
                cursorDot.classList.toggle('hovered', Boolean(el));
                cursorRing.classList.toggle('hovered', Boolean(el));
                const text = el?.getAttribute('data-cursor-text');
                cursorRing.classList.toggle('has-text', Boolean(text));
                if (cTextEl) cTextEl.textContent = text || '';
                cursorDot.style.opacity = text ? '0' : '';
            };
            // Hide the follower until the pointer is actually over the page.
            const show = () => { cursorDot.style.visibility = ''; cursorRing.style.visibility = ''; };
            const hide = () => { cursorDot.style.visibility = 'hidden'; cursorRing.style.visibility = 'hidden'; };
            hide();
            window.addEventListener('mousemove', show, { once: true });
            document.addEventListener('mouseover', handleOver);
            document.documentElement.addEventListener('mouseleave', hide);
            document.documentElement.addEventListener('mouseenter', show);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('mousemove', show);
                document.removeEventListener('mouseover', handleOver);
                document.documentElement.removeEventListener('mouseleave', hide);
                document.documentElement.removeEventListener('mouseenter', show);
            };
        });
        return () => {
            ctx.revert();
        };
    }, []);
    return (<>
      <div className="custom-cursor-dot" id="cursor-dot" ref={cursorDotRef}></div>
      <div className="cursor-ring" id="cursor-ring" ref={cursorRingRef}>
        <span className="cursor-text" id="cursor-text"></span>
      </div>
      <div className="cursor-follow-image" id="cursor-follow-img" ref={cursorFollowImgRef}>
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt=""/>
      </div>
    </>);
};
