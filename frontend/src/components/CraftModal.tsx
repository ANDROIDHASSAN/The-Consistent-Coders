import React, { useEffect, useRef } from 'react';
import type { CraftCard } from '../types/index.js';

interface CraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CraftCard | null;
}

export const CraftModal: React.FC<CraftModalProps> = ({ isOpen, onClose, data }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!data) return null;

  return (
    <div className={`craft-modal ${isOpen ? 'is-open' : ''}`} id="craftModal" data-lenis-prevent ref={modalRef}>
      <div className="craft-modal-overlay" id="craftModalOverlay" onClick={onClose}></div>
      <div className="craft-modal-panel">
        <button className="craft-modal-close" id="craftModalClose" aria-label="Close" onClick={onClose}>
          <span></span>
          <span></span>
        </button>
        <div className="craft-modal-content">
          <div className="craft-modal-tag mono-text" id="modalTag">
            // {data.tag}
          </div>
          <h3 className="craft-modal-title" id="modalTitle">
            {data.title}
          </h3>
          <p className="craft-modal-desc" id="modalDesc">
            {data.desc}
          </p>
          <div className="craft-modal-libs" id="modalLibs">
            {data.libs.split(',').map((lib, index) => (
              <span key={index} className="craft-modal-lib">
                {lib.trim()}
              </span>
            ))}
          </div>
          <div className="craft-modal-pitfalls">
            <h4 className="mono-text">// WHAT YOU'LL LEARN</h4>
            <ul id="modalPitfalls">
              {data.pitfalls.map((pitfall, index) => (
                <li key={index}>{pitfall}</li>
              ))}
            </ul>
          </div>
          <div className="craft-modal-example">
            <h4 className="mono-text">// REGISTER</h4>
            <p id="modalExample">{data.example}</p>
          </div>
          {data.video && (
            <div className="craft-modal-video" id="modalVideo">
              <div className="video-aspect-ratio">
                <iframe
                  src={`https://www.youtube.com/embed/${data.video}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
          {data.playlist && (
            <div className="craft-modal-video" id="modalPlaylist">
              <div className="video-aspect-ratio">
                <iframe
                  src={`https://www.youtube.com/embed/videoseries?list=${data.playlist}`}
                  title="YouTube playlist player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
