import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useLenis } from './hooks/useLenis';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';
import { FullscreenMenu } from './components/FullscreenMenu';
// import { Footer } from './components/Footer';
import { BarbaWrapper } from './components/BarbaWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEOMeta } from './seo/SEOMeta';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { BuildPage } from './pages/BuildPage';
import { JoinPage } from './pages/JoinPage';
import { TasksPage } from './pages/TasksPage';
import { ContributorsPage } from './pages/ContributorsPage';
import { JobsPage } from './pages/JobsPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { initMobileOptimizations } from './utils/mobileOptimizations';
import './App.css';
import './responsive.css';
import './hamburger-fix.css';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleLoginModal } from './components/GoogleLoginModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (response.ok) {
        login(data.token, data.user);
      } else {
        setErrorMsg(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
         setErrorMsg('Database connection timeout. Please check your backend MongoDB Atlas IP whitelist.');
      } else {
         setErrorMsg('Network error. Ensure backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="locked-page-wrapper" style={{ position: 'relative', overflow: 'hidden', height: '100vh' }}>
        <div className="locked-content-blurred" style={{ filter: 'blur(12px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.3, transition: 'all 0.5s ease', height: '100vh', overflow: 'hidden' }}>
          {children}
        </div>
        <div className="locked-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <div className="locked-modal glass-card" style={{ padding: '3rem', textAlign: 'center', borderRadius: '16px', border: '1px solid rgba(204, 255, 0, 0.15)', background: 'rgba(10, 10, 10, 0.7)', backdropFilter: 'blur(20px)', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 className="serif-text" style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Access Restricted</h2>
            <p className="mono-text" style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Thanks for visiting The Consistent Coders! To view this restricted content and track your progress, you must sign in.
            </p>
            
            {errorMsg && <div style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '1.5rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255, 77, 77, 0.3)' }}>{errorMsg}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              {isLoading ? (
                <div style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>Authenticating...</div>
              ) : (
                <div className="google-btn-wrapper">
                  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '364464601188-f3a18rieechu74lmqbioiui8sjb3lsbc.apps.googleusercontent.com'}>
                    <GoogleLogin
                      onSuccess={handleSuccess}
                      onError={() => setErrorMsg('Google Login Failed locally')}
                      useOneTap
                      theme="filled_black"
                      text="continue_with"
                    />
                  </GoogleOAuthProvider>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

// Import GSAP and plugins
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lenisRef = useLenis();
  const location = useLocation();
  const appRef = useRef<HTMLElement>(null);

  // Initialize mobile optimizations
  useEffect(() => {
    const cleanup = initMobileOptimizations();
    return cleanup;
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [location.pathname]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Magnetic elements effect
  useEffect(() => {
    const ctx = gsap.context(() => {
      const magneticElements = document.querySelectorAll('.magnetic');

      magneticElements.forEach((el) => {
        const strength = parseFloat(el.getAttribute('data-strength') || '20');

        const handleMouseMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const x = (e.clientX - (rect.left + rect.width / 2)) / strength;
          const y = (e.clientY - (rect.top + rect.height / 2)) / strength;
          gsap.to(el, { x, y, duration: 0.4, ease: 'power2.out' });
        };

        const handleMouseLeave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
        };

        el.addEventListener('mousemove', handleMouseMove as EventListener);
        el.addEventListener('mouseleave', handleMouseLeave);
        
        // Store on element to clean up later
        (el as any)._magneticHandlers = { mousemove: handleMouseMove, mouseleave: handleMouseLeave };
      });
    }, appRef);

    return () => {
      const magneticElements = document.querySelectorAll('.magnetic');
      magneticElements.forEach((el) => {
        if ((el as any)._magneticHandlers) {
          el.removeEventListener('mousemove', (el as any)._magneticHandlers.mousemove);
          el.removeEventListener('mouseleave', (el as any)._magneticHandlers.mouseleave);
        }
      });
      ctx.revert();
    };
  }, []);

  // Scroll progress bar
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.scroll-progress', {
        width: '100%',
        ease: 'none',
        scrollTrigger: {
          scrub: 0,
          start: 'top top',
          end: 'bottom bottom',
        },
      });
    });
    return () => ctx.revert();
  }, []);

  // Refresh ScrollTrigger after all components mount
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Background color transitions
  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = [
        { el: '.section-hero', bg: '#0e0e0e', color: '#fafafa' },
        { el: '.section-vision', bg: '#050505', color: '#fafafa' },
        { el: '.section-stats', bg: '#0e0e0e', color: '#fafafa' },
        { el: '.section-how-it-works', bg: '#050505', color: '#fafafa' },
        { el: '.section-comparator', bg: '#0e0e0e', color: '#fafafa' },
        { el: '.section-fame', bg: '#0e0e0e', color: '#fafafa' },
        { el: '.section-footer', bg: '#050505', color: '#fafafa' },
      ];

      sections.forEach(({ el, bg, color }) => {
        const target = (appRef.current || document.body).querySelector(el);
        if (!target) return;

        ScrollTrigger.create({
          trigger: target,
          start: 'top 55%',
          onEnter: () =>
            gsap.to('body', {
              backgroundColor: bg,
              color,
              duration: 0.8,
              ease: 'power2.inOut',
              overwrite: 'auto',
            }),
          onEnterBack: () =>
            gsap.to('body', {
              backgroundColor: bg,
              color,
              duration: 0.8,
              ease: 'power2.inOut',
              overwrite: 'auto',
            }),
        });
      });
    });
    return () => ctx.revert();
  }, []);
  useEffect(() => {
    let lastScroll = 0;
    const navbar = document.getElementById('mainNav');

    const ctx = gsap.context(() => {});

    const handleScroll = ({ scroll }: { scroll: number }) => {
      if (!navbar || isMenuOpen) return;
      const direction = scroll > lastScroll ? 'down' : 'up';
      if (direction === 'down' && scroll > 200) {
        gsap.to(navbar, { y: -120, duration: 0.5, ease: 'power2.inOut' });
      } else {
        gsap.to(navbar, { y: 0, duration: 0.5, ease: 'power2.out' });
      }
      lastScroll = scroll;
    };

    if (lenisRef.current) {
      lenisRef.current.on('scroll', handleScroll);
    }

    return () => {
      if (lenisRef.current) {
        lenisRef.current.off('scroll', handleScroll);
      }
      ctx.revert();
    };
  }, [lenisRef, isMenuOpen]);

  return (
    <>
      <SEOMeta
        title="The Consistent Coders | Learn. Build. Get Hired."
        description="Consistent Coders — a community-driven ecosystem for beginners and early professionals to learn structured paths, build real projects, and launch careers."
        keywords="coding, programming, web development, react, javascript, community, learning"
      />

      {/* Noise & Overlay */}
      <div className="noise-overlay"></div>
      <div className="scroll-progress"></div>

      {/* Custom Cursor */}
      <CustomCursor />

      {/* Barba Transition Curtain */}
      <div className="transition-curtain">
        <div className="curtain-panel"></div>
        <div className="curtain-panel"></div>
        <div className="curtain-panel"></div>
        <div className="curtain-panel"></div>
        <div className="curtain-panel"></div>
      </div>

      {/* Liquid Filter SVG */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="liquid">
            <feTurbulence type="fractalNoise" baseFrequency="0.005 0.005" numOctaves={2} result="warp" />
            <feDisplacementMap
              xChannelSelector="R"
              yChannelSelector="G"
              scale="30"
              in="SourceGraphic"
              in2="warp"
              id="liquid-displacement"
            />
          </filter>
        </defs>
      </svg>

      {/* Navigation */}
      <Navbar onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />

      {/* Fullscreen Menu */}
      <FullscreenMenu isOpen={isMenuOpen} onClose={closeMenu} lenisRef={lenisRef} />

      {/* Main Content */}
      <main data-barba="wrapper" ref={appRef}>
        <div data-barba="container" data-barba-namespace="home">
          <div className="scroll-container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/build" element={<BuildPage />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
              <Route path="/contributors" element={<ContributorsPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </div>
      </main>
    </>
  );
}

function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '364464601188-f3a18rieechu74lmqbioiui8sjb3lsbc.apps.googleusercontent.com';
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          <Router>
            <BarbaWrapper>
              <AppContent />
              <GoogleLoginModal />
            </BarbaWrapper>
          </Router>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
