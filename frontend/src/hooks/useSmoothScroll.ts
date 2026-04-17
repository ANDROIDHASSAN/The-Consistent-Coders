/**
 * useSmoothScroll Hook
 * Purpose: Provides advanced smooth scrolling functionality using both Lenis
 * and Locomotive Scroll libraries. Offers configurable scroll behavior with
 * GSAP integration for scroll-based animations.
 * 
 * @param options - Configuration options for smooth scrolling behavior
 * @returns Object containing lenisRef and locomotiveRef for manual control
 */
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import LocomotiveScroll from 'locomotive-scroll';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * SmoothScrollOptions Interface
 * Defines configuration options for smooth scroll behavior
 */
interface SmoothScrollOptions {
  enableLocomotiveScroll?: boolean; // Enable Locomotive Scroll library
  duration?: number; // Scroll animation duration
  lerp?: number; // Linear interpolation amount (smoothness)
}

export const useSmoothScroll = (options: SmoothScrollOptions = {}) => {
  const {
    enableLocomotiveScroll = true,
    duration = 1.2,
    lerp = 0.1,
  } = options;

  const lenisRef = useRef<Lenis | null>(null);
  const locomotiveRef = useRef<LocomotiveScroll | null>(null);

  useEffect(() => {
    /**
     * Initialize Lenis Smooth Scrolling
     * Purpose: Creates smooth, momentum-based scrolling with custom easing
     */
    const lenis = new Lenis({
      duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      lerp,
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
      autoResize: true,
    });

    lenisRef.current = lenis;

    /**
     * Initialize Locomotive Scroll (Optional)
     * Purpose: Provides additional scroll effects and parallax capabilities
     */
    if (enableLocomotiveScroll) {
      const locomotiveScroll = new LocomotiveScroll({
        lenisOptions: {
          duration,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          lerp,
          smoothWheel: true,
        },
      });

      locomotiveRef.current = locomotiveScroll;
    }

    /**
     * Connect Lenis to GSAP ScrollTrigger
     * Purpose: Synchronizes scroll position with ScrollTrigger animations
     */
    lenis.on('scroll', ScrollTrigger.update);

    /**
     * Animation Loop (RAF)
     * Purpose: Continuously updates Lenis on each animation frame
     */
    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    /**
     * Refresh ScrollTrigger After Initialization
     * Purpose: Ensures all scroll-based animations are properly calculated
     */
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    /**
     * Cleanup Function
     * Purpose: Destroys scroll instances and clears timers
     */
    return () => {
      clearTimeout(refreshTimer);
      lenis.destroy();
      if (locomotiveRef.current) {
        locomotiveRef.current.destroy();
      }
    };
  }, [duration, lerp, enableLocomotiveScroll]);

  return { lenisRef, locomotiveRef };
};
