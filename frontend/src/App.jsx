import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { useLenis } from './hooks/useLenis';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';
import { FullscreenMenu } from './components/FullscreenMenu';
import { BarbaWrapper } from './components/BarbaWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toasts } from './components/Toasts';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { BuildPage } from './pages/BuildPage';
import { JoinPage } from './pages/JoinPage';
import { TasksPage } from './pages/TasksPage';
import { ContributorsPage } from './pages/ContributorsPage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { PostJobPage } from './pages/PostJobPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { MemberPage } from './pages/MemberPage';
import { Onboarding } from './components/Onboarding';
import { NavTour } from './components/NavTour';
import { initMobileOptimizations } from './utils/mobileOptimizations';
import './App.css';
import './responsive.css';
import './hamburger-fix.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const isBrowser = typeof window !== 'undefined';

/** Route table — shared by the client app and the build-time prerender. */
export const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/new" element={<PostJobPage />} />
        <Route path="/jobs/:slug" element={<JobDetailPage />} />
        <Route path="/jobs/:slug/edit" element={<PostJobPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/members/:id" element={<MemberPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/build" element={<BuildPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/contributors" element={<ContributorsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
);

function AppContent() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const lenisRef = useLenis();
    const location = useLocation();
    const appRef = useRef(null);

    useEffect(() => initMobileOptimizations(), []);

    const toggleMenu = () => setIsMenuOpen((prev) => !prev);
    const closeMenu = () => setIsMenuOpen(false);

    // Scroll to top on route change (skip when navigating to an in-page anchor)
    useEffect(() => {
        if (!location.hash) window.scrollTo(0, 0);
        ScrollTrigger.refresh();
    }, [location.pathname, location.hash]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isMenuOpen) closeMenu();
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
                const handleMouseMove = (e) => {
                    const rect = el.getBoundingClientRect();
                    const x = (e.clientX - (rect.left + rect.width / 2)) / strength;
                    const y = (e.clientY - (rect.top + rect.height / 2)) / strength;
                    gsap.to(el, { x, y, duration: 0.4, ease: 'power2.out' });
                };
                const handleMouseLeave = () => {
                    gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
                };
                el.addEventListener('mousemove', handleMouseMove);
                el.addEventListener('mouseleave', handleMouseLeave);
                el._magneticHandlers = { mousemove: handleMouseMove, mouseleave: handleMouseLeave };
            });
        }, appRef);
        return () => {
            document.querySelectorAll('.magnetic').forEach((el) => {
                if (el._magneticHandlers) {
                    el.removeEventListener('mousemove', el._magneticHandlers.mousemove);
                    el.removeEventListener('mouseleave', el._magneticHandlers.mouseleave);
                }
            });
            ctx.revert();
        };
    }, [location.pathname]);

    // Scroll progress bar
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to('.scroll-progress', {
                width: '100%',
                ease: 'none',
                scrollTrigger: { scrub: 0, start: 'top top', end: 'bottom bottom' },
            });
        });
        return () => ctx.revert();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => ScrollTrigger.refresh(), 300);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Background color transitions on the home page sections
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
                const tween = () => gsap.to('body', { backgroundColor: bg, color, duration: 0.8, ease: 'power2.inOut', overwrite: 'auto' });
                ScrollTrigger.create({ trigger: target, start: 'top 55%', onEnter: tween, onEnterBack: tween });
            });
        });
        return () => ctx.revert();
    }, [location.pathname]);

    // Hide navbar on scroll down, show on scroll up
    useEffect(() => {
        let lastScroll = 0;
        const navbar = document.getElementById('mainNav');
        const handleScroll = ({ scroll }) => {
            if (!navbar || isMenuOpen) return;
            const direction = scroll > lastScroll ? 'down' : 'up';
            if (direction === 'down' && scroll > 200) gsap.to(navbar, { y: -120, duration: 0.5, ease: 'power2.inOut' });
            else gsap.to(navbar, { y: 0, duration: 0.5, ease: 'power2.out' });
            lastScroll = scroll;
        };
        const lenis = lenisRef.current;
        lenis?.on('scroll', handleScroll);
        return () => lenis?.off('scroll', handleScroll);
    }, [lenisRef, isMenuOpen]);

    return (
        <>
            <a href="#main" className="skip-link">Skip to content</a>
            <div className="noise-overlay"></div>
            <div className="scroll-progress"></div>
            <CustomCursor />

            <div className="transition-curtain">
                <div className="curtain-panel"></div>
                <div className="curtain-panel"></div>
                <div className="curtain-panel"></div>
                <div className="curtain-panel"></div>
                <div className="curtain-panel"></div>
            </div>

            <svg style={{ display: 'none' }} aria-hidden="true">
                <defs>
                    <filter id="liquid">
                        <feTurbulence type="fractalNoise" baseFrequency="0.005 0.005" numOctaves={2} result="warp" />
                        <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="30" in="SourceGraphic" in2="warp" id="liquid-displacement" />
                    </filter>
                </defs>
            </svg>

            <Navbar onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
            <FullscreenMenu isOpen={isMenuOpen} onClose={closeMenu} lenisRef={lenisRef} />

            <main id="main" data-barba="wrapper" ref={appRef}>
                <div data-barba="container" data-barba-namespace="home">
                    <div className="scroll-container">
                        <AppRoutes />
                    </div>
                </div>
            </main>
            <Onboarding />
            <NavTour />
            <Toasts />
        </>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <BarbaWrapper>
                <AppContent />
            </BarbaWrapper>
            {isBrowser && <Analytics />}
        </ErrorBoundary>
    );
}

export default App;
