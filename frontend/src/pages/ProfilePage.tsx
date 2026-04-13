import React from 'react';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.profile-content > *', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="page-container" ref={pageRef} style={{ minHeight: '100vh', paddingTop: '120px', paddingBottom: '60px' }}>
      <div className="container">
        <h1 className="hero-title mb-8">Your Profile</h1>
        <div className="profile-content glass-card p-8 rounded-xl border border-white/10 max-w-2xl">
          {user ? (
            <div className="flex items-center gap-6 mb-8">
              {user.picture ? (
                <img src={user.picture} alt="Profile" className="w-24 h-24 rounded-full border-2 border-[var(--color-accent)]" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--color-accent)] text-black flex items-center justify-center text-3xl font-mono font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-display mb-1">{user.name}</h2>
                <p className="text-white/50 font-mono text-sm mb-2">{user.email}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
                  Role: {user.role || 'Member'}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/50">Loading profile data...</p>
          )}
          
          <div className="h-px bg-white/10 my-8"></div>
          
          <h3 className="text-xl font-display mb-4">Activity & Stats</h3>
          <p className="text-white/50 mb-4 font-mono text-sm">More features coming soon...</p>
        </div>
      </div>
    </div>
  );
};
