import { BLOG_POSTS, getPostMeta } from './meta';
import FirstJob from './posts/first-developer-job-india.jsx';
import BestProjects from './posts/best-projects-fresher-resume.jsx';
import InternVsFull from './posts/internship-vs-full-time.jsx';
import RemoteJobs from './posts/remote-jobs-for-students.jsx';
import WriteJobPost from './posts/write-a-job-post.jsx';
import GithubProfile from './posts/github-profile-checklist.jsx';
import ColdEmail from './posts/cold-email-referrals.jsx';

// Static imports (not lazy) so the build-time prerender emits the full article HTML.
const BODIES = {
    'how-to-get-your-first-developer-job-in-india': FirstJob,
    'best-projects-for-fresher-resume': BestProjects,
    'internship-vs-full-time-fresher': InternVsFull,
    'remote-developer-jobs-for-students': RemoteJobs,
    'how-to-write-a-job-post-that-gets-applicants': WriteJobPost,
    'github-profile-that-gets-you-hired': GithubProfile,
    'cold-email-template-for-developer-referrals': ColdEmail,
};

export { BLOG_POSTS, getPostMeta };
export const getPostBody = (slug) => BODIES[slug] ?? null;
