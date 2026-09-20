import React, { useEffect, useRef } from 'react';
export const CraftModal = ({ isOpen, onClose, data, progress, onToggleStep, busyStep, signedIn = true }) => {
    const modalRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);
    if (!data)
        return null;
    return (<div className={`craft-modal ${isOpen ? 'is-open' : ''}`} id="craftModal" data-lenis-prevent ref={modalRef}>
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
            {data.libs.split(',').map((lib, index) => (<span key={index} className="craft-modal-lib">
                {lib.trim()}
              </span>))}
          </div>
          <div className="craft-modal-pitfalls">
            {onToggleStep ? (<>
                <h4 className="mono-text"> // CHECKPOINTS · +1 EACH · +5 TO FINISH THE PATH</h4>
                {!signedIn && <p className="craft-modal-hint">Sign in to track your progress and earn Learning points.</p>}
                <ul className="checkpoints">
                  {data.pitfalls.map((pitfall, index) => {
                    const done = Boolean(progress?.done?.[index]);
                    return (<li key={index}>
                        <button type="button" className={`checkpoint ${done ? 'is-done' : ''}`} disabled={done || busyStep === index} aria-pressed={done} onClick={() => onToggleStep(data, index)}>
                          <span className="check" aria-hidden="true">{done ? '✓' : ''}</span>
                          <span>{pitfall}</span>
                          <small className="mono-text">{done ? 'DONE' : busyStep === index ? '…' : '+1'}</small>
                        </button>
                      </li>);
                  })}
                </ul>
                {progress?.completed && <p className="craft-modal-hint">🎓 Path complete. Your Learning arena thanks you.</p>}
              </>) : (<>
                <h4 className="mono-text"> // WHAT YOU'LL LEARN</h4>
                <ul id="modalPitfalls">
                  {data.pitfalls.map((pitfall, index) => (<li key={index}>{pitfall}</li>))}
                </ul>
              </>)}
          </div>
          <div className="craft-modal-example">
            <h4 className="mono-text"> // REGISTER</h4>
            <p id="modalExample">{data.example}</p>
          </div>
          {data.video && (<div className="craft-modal-video" id="modalVideo">
              <div className="video-aspect-ratio">
                <iframe src={`https://www.youtube.com/embed/${data.video}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
};
