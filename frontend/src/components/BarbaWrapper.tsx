import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface BarbaWrapperProps {
  children: React.ReactNode;
}
//omkarr
export const BarbaWrapper: React.FC<BarbaWrapperProps> = ({ children }) => {
  const location = useLocation();
  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const ctx = gsap.context(() => {});

    // Page transition animation on route change
    const panels = document.querySelectorAll('.curtain-panel');
    
    if (panels.length === 0) {
      // If curtain panels don't exist, just scroll to top and refresh
      window.scrollTo(0, 0);
      setTimeout(() => {
        try {
          ScrollTrigger.refresh();
        } catch (error) {
          console.warn('ScrollTrigger refresh error:', error);
        }
      }, 100);
      return;
    }
    
    const animatePageTransition = async () => {
      try {
        const curtain = document.querySelector('.transition-curtain');
        if (!curtain) return;

        let tl1: gsap.core.Timeline | undefined;
        ctx.add(() => {
          tl1 = gsap.timeline()
            .set(curtain, { display: 'flex' })
            .to(panels, {
              scaleY: 1,
              duration: 0.5,
              stagger: 0.05,
              ease: 'power3.inOut',
            });
        });
        if (tl1) await tl1;
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Refresh ScrollTrigger after content is ready
        try {
          ScrollTrigger.refresh();
        } catch (error) {
          console.warn('ScrollTrigger refresh error:', error);
        }
        
        // Animate curtain panels going up (revealing the new page)
        let tl2: gsap.core.Timeline | undefined;
        ctx.add(() => {
          tl2 = gsap.timeline()
            .to(panels, {
              scaleY: 0,
              duration: 0.5,
              stagger: 0.05,
              ease: 'power3.inOut',
            })
            .set(curtain, { display: 'none' });
        });
        if (tl2) await tl2;
      } catch (error) {
        console.warn('Page transition error:', error);
        // If animation fails, just ensure we scroll to top
        window.scrollTo(0, 0);
        const curtain = document.querySelector('.transition-curtain');
        if (curtain) {
          gsap.set(curtain, { display: 'none' });
        }
        setTimeout(() => {
          try {
            ScrollTrigger.refresh();
          } catch (err) {
            console.warn('ScrollTrigger refresh error:', err);
          }
        }, 100);
      }
    };
    
    animatePageTransition();

    return () => ctx.revert();
  }, [location.pathname]);

  return <>{children}</>;
};
