import { useGame } from '../context/GameContext';

export const Toasts = () => {
    const { toasts } = useGame();
    if (!toasts.length) return null;
    return (
        <div className="toasts" role="status" aria-live="polite">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast--${t.kind}`}>
                    {t.kind === 'points' && <span className="toast-icon">⚡</span>}
                    {t.kind === 'levelup' && <span className="toast-icon">🏆</span>}
                    {t.kind === 'success' && <span className="toast-icon">✓</span>}
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
};
