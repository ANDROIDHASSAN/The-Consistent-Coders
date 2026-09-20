import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import App from './App.jsx';
import { GameProvider } from './context/GameContext.jsx';
import 'lenis/dist/lenis.css';
import './smoothScroll.css';
import './style.css';
import './homepage-fix.css';
import './directory.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Dark theme matching the site. Both the current and legacy Clerk variable names are set.
const CLERK_APPEARANCE = {
    variables: {
        colorPrimary: '#ccff00',
        colorPrimaryForeground: '#050505',
        colorTextOnPrimaryBackground: '#050505',
        colorBackground: '#121212',
        colorForeground: '#fafafa',
        colorText: '#fafafa',
        colorMutedForeground: '#a3a3a3',
        colorTextSecondary: '#a3a3a3',
        colorInput: '#1c1c1c',
        colorInputBackground: '#1c1c1c',
        colorInputForeground: '#fafafa',
        colorInputText: '#fafafa',
        colorNeutral: '#fafafa',
        borderRadius: '10px',
    },
};

// Without a key the site still renders (read-only); sign-in buttons explain what's missing.
const withClerk = (node) => (PUBLISHABLE_KEY
    ? <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/" appearance={CLERK_APPEARANCE}>{node}</ClerkProvider>
    : node);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {withClerk(
            <BrowserRouter>
                <GameProvider>
                    <App />
                </GameProvider>
            </BrowserRouter>,
        )}
    </React.StrictMode>,
);
