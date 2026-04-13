import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export const GoogleLoginModal: React.FC = () => {
  const { setShowLoginModal, login, showLoginModal } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!showLoginModal) return null;

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout to avoid hang

      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (response.ok) {
        login(data.token, data.user);
        setShowLoginModal(false);
      } else {
        console.error('Login failed:', data.error);
        setErrorMsg(data.error || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Error during login:', err);
      if (err.name === 'AbortError') {
         setErrorMsg('Database connection timeout. Please check your backend MongoDB Atlas IP whitelist.');
      } else {
         setErrorMsg('Network error. Ensure backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
      <div className="login-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
        <h2 className="serif-text">Restricted Access</h2>
        <p className="mono-text login-subtitle">Please sign in with Google to continue.</p>
        
        {errorMsg && <div className="error-message">{errorMsg}</div>}
        
        {isLoading ? (
          <div className="loading-spinner">Authenticating... Please wait</div>
        ) : (
          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                setErrorMsg('Google Login Failed locally');
                console.error('Google Login Failed');
              }}
              useOneTap
              theme="filled_black"
            />
          </div>
        )}
      </div>
      <style>{`
        .login-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(10px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-modal-content {
          background: #0e0e0e;
          border: 1px solid var(--color-accent, #ccff00);
          padding: 3rem;
          border-radius: 8px;
          text-align: center;
          position: relative;
          max-width: 400px;
          width: 90%;
        }
        .login-subtitle {
          margin: 1rem 0 2rem;
          opacity: 0.7;
        }
        .google-btn-wrapper {
          display: flex;
          justify-content: center;
        }
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1.5rem;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 2rem;
          cursor: pointer;
        }
        .error-message {
          color: #ff4d4d;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          background: rgba(255, 77, 77, 0.1);
          padding: 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(255, 77, 77, 0.3);
        }
        .loading-spinner {
          color: var(--color-accent);
          font-family: var(--font-mono);
          margin-bottom: 2rem;
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
