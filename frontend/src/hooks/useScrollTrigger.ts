/**
 * useScrollTrigger Hook
 * Purpose: Custom hook to safely manage GSAP ScrollTrigger instances with proper
 * cleanup on component unmount. Prevents memory leaks and ensures animations
 * are properly disposed when components are removed from the DOM.
 * 
 * @param callback - Function that creates ScrollTrigger animations, can return cleanup function
 * @param deps - Dependency array to re-run effect when values change
 * @param delay - Optional delay before initializing animations (in milliseconds)
 * @returns ref - React ref to attach to the element that will be animated
 */
import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useScrollTrigger = (
  callback: (ctx: gsap.Context) => void | (() => void),
  deps: any[] = [],
  delay: number = 0
): MutableRefObject<HTMLElement | null> => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let ctx: gsap.Context | null = null;
    let customCleanup: (() => void) | null = null;

    /**
     * init Function
     * Purpose: Initializes GSAP context and executes the animation callback
     */
    const init = () => {
      if (!ref.current) return;

      ctx = gsap.context(() => {
        const cleanup = callback(ctx!);
        if (typeof cleanup === 'function') {
          customCleanup = cleanup;
        }
      }, ref);
    };

    // Delay initialization if specified (useful for staggered animations)
    if (delay > 0) {
      timeoutId = setTimeout(init, delay);
    } else {
      init();
    }

    /**
     * Cleanup Function
     * Purpose: Clears timeout, runs custom cleanup, and reverts GSAP context
     */
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (customCleanup) customCleanup();
      if (ctx) ctx.revert();
    };
  }, deps);

  return ref;
};
