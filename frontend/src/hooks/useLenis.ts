/**
 * useLenis Hook
 * Purpose: Initializes and manages Lenis smooth scrolling library integrated with GSAP.
 * Provides buttery-smooth scroll animations and connects to ScrollTrigger for
 * scroll-based animations throughout the application.
 * @returns lenisRef - Reference to the Lenis instance for manual control
 */
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useLenis = () => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    /**
     * Initialize Lenis Smooth Scroll
     * Purpose: Creates smooth, momentum-based scrolling with customizable easing
     * and integrates with GSAP for animation synchronization
     */
    const lenis = new Lenis({
      duration: 1.2, // Scroll animation duration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo curve
      lerp: 0.1, // Linear interpolation amount (smoothness)
      smoothWheel: true, // Enable smooth wheel scrolling
      touchMultiplier: 2, // Touch scroll sensitivity
      infinite: false, // Disable infinite scroll
      autoResize: true, // Auto-adjust on window resize
    });

    lenisRef.current = lenis;
    (window as any).lenis = lenis; // Make globally accessible

    /**
     * Connect Lenis to GSAP ScrollTrigger
     * Purpose: Synchronizes Lenis scroll position with ScrollTrigger animations
     */
    lenis.on('scroll', ScrollTrigger.update);

    /**
     * GSAP Ticker Integration
     * Purpose: Uses GSAP's animation frame ticker for optimal performance
     */
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0); // Disable lag smoothing for consistent performance

    /**
     * Refresh ScrollTrigger After Initialization
     * Purpose: Ensures all scroll-based animations are properly calculated
     */
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    /**
     * Cleanup Function
     * Purpose: Properly destroys Lenis instance and removes GSAP ticker
     */
    return () => {
      clearTimeout(refreshTimer);
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return lenisRef;
};
