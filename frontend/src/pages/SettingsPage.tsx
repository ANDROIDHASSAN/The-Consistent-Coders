import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export const SettingsPage: React.FC = () => {
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.settings-content > *', {
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
        <h1 className="hero-title mb-8">Settings</h1>
        <div className="settings-content glass-card p-8 rounded-xl border border-white/10 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 border-r border-white/10 pr-6">
              <ul className="space-y-4 font-mono text-sm">
                <li className="text-[var(--color-accent)] cursor-pointer">Account Settings</li>
                <li className="text-white/50 hover:text-white cursor-pointer transition-colors">Preferences</li>
                <li className="text-white/50 hover:text-white cursor-pointer transition-colors">Notifications</li>
                <li className="text-white/50 hover:text-white cursor-pointer transition-colors">Security</li>
              </ul>
            </div>
            <div className="col-span-1 md:col-span-3">
              <h2 className="text-2xl font-display mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-wider">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[var(--color-accent)] focus:outline-none transition-colors font-mono text-sm"
                    placeholder="Enter your display name"
                    readOnly
                    value="User"
                  />
                  <p className="text-xs text-white/30 mt-2 font-mono">This name will be visible to other members.</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-wider">Theme Preference</label>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 rounded border border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/10 font-mono text-sm cursor-default">Dark Mode</button>
                    <button className="px-4 py-2 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors font-mono text-sm line-through opacity-50" title="Coming soon">Light Mode</button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-8">
                  <h3 className="text-red-500 font-display mb-2">Danger Zone</h3>
                  <p className="text-white/50 text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="px-4 py-2 rounded border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-mono text-sm">Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
