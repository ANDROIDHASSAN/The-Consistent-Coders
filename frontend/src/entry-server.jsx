import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import App from './App.jsx';
import { GameProvider } from './context/GameContext.jsx';
import { SeoCollector, tagsToHtml } from './seo/Seo.jsx';

/**
 * Build-time prerender entry. Renders one route to HTML and returns the
 * <head> tags the page's <Seo> declared. No Clerk here — the stub session
 * in lib/auth.js renders every page in its signed-out state.
 */
export function render(url) {
    const collector = { tags: null, set(tags) { this.tags = tags; } };
    const html = renderToString(
        <SeoCollector.Provider value={collector}>
            <StaticRouter location={url}>
                <GameProvider>
                    <App />
                </GameProvider>
            </StaticRouter>
        </SeoCollector.Provider>,
    );
    return { html, head: collector.tags ? tagsToHtml(collector.tags) : '' };
}
