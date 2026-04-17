/**
 * useBarba Hook
 * Purpose: Initializes Barba.js for smooth page transitions between routes.
 * Creates cinematic curtain-style transitions with GSAP animations when
 * navigating between pages in the application.
 */
import { useEffect } from 'react';
import barba from '@barba/core';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useBarba = () => {
  useEffect(() => {
    /**
     * Initialize Barba.js Page Transitions
     * Purpose: Manages smooth transitions between pages without full page reloads
     */
    barba.init({
      /**
       * prevent Function
       * Purpose: Determines which links should bypass Barba transitions
       * (external links, links with target attribute, or .no-barba class)
       */
      prevent: ({ el }: any) => {
        return el.classList?.contains('no-barba') || 
               el.hasAttribute('target') || 
               el.hostname !== window.location.hostname;
      },
      transitions: [
        {
          name: 'curtain-transition',
          /**
           * leave Function
           * Purpose: Animates the exit of the current page with curtain panels
           * @param data - Contains current page container and other transition data
           */
          leave(data: any) {
            return new Promise<void>((resolve) => {
              const panels = document.querySelectorAll('.curtain-panel');
              
              gsap.timeline()
                .set('.transition-curtain', { display: 'flex' })
                .to(panels, {
                  scaleY: 1, // Expand curtain panels
                  duration: 0.8,
                  stagger: 0.08, // Stagger animation across panels
                  ease: 'power4.inOut',
                })
                .to(data.current.container, {
                  opacity: 0, // Fade out current page
                  duration: 0.3,
                  onComplete: resolve,
                }, '-=0.4');
            });
          },
          /**
           * enter Function
           * Purpose: Animates the entrance of the new page, revealing content
           * @param data - Contains next page container and other transition data
           */
          enter(data: any) {
            return new Promise<void>((resolve) => {
              // Reset scroll position
              window.scrollTo(0, 0);
              
              // Refresh ScrollTrigger for new page
              ScrollTrigger.refresh();
              
              const panels = document.querySelectorAll('.curtain-panel');
              
              gsap.timeline()
                .set(data.next.container, { opacity: 0 })
                .to(data.next.container, {
                  opacity: 1, // Fade in new page
                  duration: 0.3,
                })
                .to(panels, {
                  scaleY: 0, // Retract curtain panels
                  duration: 0.8,
                  stagger: 0.08,
                  ease: 'power4.inOut',
                }, '-=0.2')
                .set('.transition-curtain', { display: 'none', onComplete: resolve });
            });
          },
        } as any,
      ],
    });

    /**
     * Cleanup Function
     * Purpose: Destroys Barba instance on component unmount
     */
    return () => {
      barba.destroy();
    };
  }, []);
};
