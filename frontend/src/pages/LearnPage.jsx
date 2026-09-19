import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SignInButton } from '@clerk/react';
import { Craft } from '../components/Craft';
import { CraftModal } from '../components/CraftModal';
import { Footer } from '../components/Footer';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Cta } from '../components/Cta';
import { Seo } from '../seo/Seo';
import { useApi } from '../lib/api';
import { CLERK_ENABLED, useSession } from '../lib/auth';
import { useGame } from '../context/GameContext';

export const LearnPage = () => {
    const api = useApi();
    const { isSignedIn } = useSession();
    const { me, celebrate, toast } = useGame();
    const [modalData, setModalData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [busyStep, setBusyStep] = useState(null);
    const [progress, setProgress] = useState(null);

    // Progress comes with the dashboard payload; keep a local copy for instant ticks.
    const learning = me?.learning;
    useEffect(() => {
        if (learning) setProgress(Object.fromEntries(learning.map((p) => [p.id, p])));
    }, [learning]);

    const handleCardClick = (card) => {
        setModalData(card);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setModalData(null), 300);
    };

    const toggleStep = useCallback(async (card, step) => {
        if (!isSignedIn) { toast('Sign in to track progress and earn Learning points.', { kind: 'info' }); return; }
        setBusyStep(step);
        try {
            const res = await api('/learn/progress', { method: 'POST', body: { pathId: card.id, step } });
            setProgress((p) => ({ ...p, [card.id]: res.path }));
            await celebrate(res.rewards);  
        }
        catch (err) {
            toast(err.message, { kind: 'error', sound: 'error' });
        }
        finally {
            setBusyStep(null);
        }
    }, [api, celebrate, isSignedIn, toast]);

    const learn = me?.user?.arenas?.learn;
    const paths = progress ? Object.values(progress) : [];
    const doneSteps = paths.reduce((n, p) => n + p.done.filter(Boolean).length, 0);
    const totalSteps = paths.reduce((n, p) => n + p.steps, 0);

    return (<>
      <Seo title="Learn to Code with Structured Paths — Frontend, Backend, Full-Stack" description="Free, structured learning paths for beginners: frontend, backend, full-stack and more. Track every checkpoint, earn Learning points and climb the learning leaderboard." path="/learn" jsonLd={Breadcrumbs.schema([{ name: 'Learn', path: '/learn' }])} />
      <div className="container" style={{ paddingTop: 'calc(var(--nav-height) + 1.5rem)' }}>
        <Breadcrumbs items={[{ name: 'Learn', path: '/learn' }]} />
        <p className="page-eyebrow mono-text">// 📚 LEARNING ARENA</p>
        <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.6rem)' }}>Learn to code with <em>structured paths</em></h1>
        <p className="page-lede">Open a path, tick off each checkpoint as you finish it (<b>+1</b>), and complete the whole path for a <b>+5</b> bonus. The <Link to="/leaderboard?arena=learn">Learning leaderboard</Link> shows who's most consistent.</p>
        {learn && totalSteps > 0 ? (
          <div className="learn-summary">
            <span className="mono-text">LV {learn.level} · {learn.points} PTS</span>
            <div className="arena-bar" style={{ '--arena': '#7cc4ff' }}><i style={{ width: `${(doneSteps / totalSteps) * 100}%` }}/></div>
            <span className="mono-text">{doneSteps}/{totalSteps} CHECKPOINTS · {paths.filter((p) => p.completed).length}/{paths.length} PATHS</span>
          </div>
        ) : CLERK_ENABLED && !isSignedIn ? (
          <p style={{ marginTop: '1rem' }}><SignInButton mode="modal"><button type="button" className="btn-ghost">SIGN IN TO TRACK PROGRESS</button></SignInButton></p>
        ) : null}
      </div>
      <Craft onCardClick={handleCardClick} progress={progress}/>
      <CraftModal isOpen={isModalOpen} onClose={closeModal} data={modalData} progress={modalData ? progress?.[modalData.id] : null} onToggleStep={toggleStep} busyStep={busyStep} signedIn={isSignedIn}/>
      <Cta title="Learned something? Prove it." text="Ship it as a project (+3) or apply to a fresher role (+1). Every arena counts toward your overall rank." primary={{ to: '/projects', label: 'SHIP A PROJECT →' }} secondary={{ to: '/jobs', label: 'BROWSE JOBS' }} />
      <Footer />
    </>);
};
