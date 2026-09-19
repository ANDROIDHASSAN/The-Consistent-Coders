import { Link } from 'react-router-dom';
import { breadcrumbSchema, SITE_URL } from '../seo/Seo';

/**
 * Visible breadcrumb trail + BreadcrumbList JSON-LD.
 * `items`: [{ name, path }] — the last one is the current page.
 */
export const Breadcrumbs = ({ items }) => {
    const trail = [{ name: 'Home', path: '/' }, ...items];
    return (
        <nav className="crumbs mono-text" aria-label="Breadcrumb">
            <ol>
                {trail.map((item, i) => {
                    const last = i === trail.length - 1;
                    return (
                        <li key={item.path}>
                            {last
                                ? <span aria-current="page">{item.name}</span>
                                : <Link to={item.path}>{item.name}</Link>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

Breadcrumbs.schema = (items) => breadcrumbSchema([{ name: 'Home', path: '/' }, ...items]);
Breadcrumbs.url = (path) => `${SITE_URL}${path}`;
