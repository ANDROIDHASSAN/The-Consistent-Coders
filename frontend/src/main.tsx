/**
 * Main Entry Point
 * Purpose: Application bootstrap file that initializes React and renders
 * the root App component with all necessary global styles
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import 'lenis/dist/lenis.css';
import './smoothScroll.css';
import './style.css';
import './homepage-fix.css';

// Render the React application to the DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
