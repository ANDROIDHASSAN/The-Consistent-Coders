/**
 * Sessions Data
 * Purpose: Contains information about upcoming workshops, live sessions,
 * career guidance events, and past recordings. Used to display the community's
 * learning events calendar and encourage member participation.
 */
import type { CraftCard } from '../types/index.js';

/**
 * Upcoming Sessions Array
 * Purpose: Active and scheduled sessions with registration details
 */
export const upcomingSessions: CraftCard[] = [
  {
    id: 'session-react',
    tag: 'WORKSHOP',
    title: 'React Hooks Masterclass',
    desc: 'A 3-hour deep dive into React hooks — useEffect pitfalls, custom hooks patterns, performance optimization with useMemo and useCallback, and building a real feature live.',
    libs: 'April 18, 2026 • 7:00 PM IST • Google Meet',
    pitfalls: [
      'Must know React basics before attending',
      'Have Node.js installed and a React project ready',
      'Bring your own bug to the doubt-solving segment',
      'Recording available 24 hours after session',
    ],
    example:
      'Seats: 50 remaining. Level: Intermediate. Instructor: Arjun Mehta (3 yrs React, ex-Razorpay). Register via Discord or the link below.',
  },
  {
    id: 'session-portfolio',
    tag: 'CAREER',
    title: 'Portfolio That Gets You Hired',
    desc: 'A career guidance session on what hiring managers actually look at. We\'ll roast and improve real member portfolios live, covering structure, project storytelling, and technical depth.',
    libs: 'April 22, 2026 • 6:30 PM IST • Google Meet',
    pitfalls: [
      'Submit your portfolio link in Discord before the session',
      'All skill levels welcome',
      'Bring 3 questions about your career path',
      'Honest, constructive feedback will be given',
    ],
    example:
      'Seats: 30 remaining. Level: All levels. Panelists: Priya Sharma (Hiring Lead, TechMint) + 2 TCC senior members. Submit your portfolio for live roast by April 20.',
  },
  {
    id: 'session-system',
    tag: 'ADVANCED',
    title: 'System Design Live',
    desc: 'Design a URL shortener from scratch live, covering database choices, caching, rate limiting, and scaling to 1 million users. Includes mock interview format — answer design questions on the spot.',
    libs: 'April 25, 2026 • 8:00 PM IST • Google Meet',
    pitfalls: [
      'Know basic databases and HTTP before attending',
      'Bring pen and paper for diagrams',
      'Active participation required — no passive watching',
      'Questions encouraged throughout',
    ],
    example:
      'Seats: 25 remaining. Level: Intermediate/Advanced. Instructor: Rohit Kumar (System Design, ex-Flipkart). Great prep for senior/FAANG interviews.',
  },
  {
    id: 'session-doubt',
    tag: 'DOUBT SOLVING',
    title: 'Open Doubt Session',
    desc: 'Bring any problem — CSS bug, JavaScript confusion, career question, or project architecture doubt. TCC seniors and mentors help solve them live, one by one. No question is too basic.',
    libs: 'Every Sunday • 5:00 PM IST • Discord Stage',
    pitfalls: [
      'Submit your doubt in #doubt-queue channel 1 hour before',
      'Be ready to screenshare your code',
      'First-come, first-served — arrive early',
      'Help someone else while waiting for your turn',
    ],
    example:
      'Recurring session. Free for all members. Drop into the Discord server and hit the #sunday-doubt-session channel to queue up. No registration needed.',
  },
];

/**
 * Past Recordings Array
 * Purpose: Archive of previously recorded sessions available to members
 */
export const pastRecordings = [
  'Git Fundamentals Workshop',
  'Resume & LinkedIn Masterclass',
  'JavaScript Async Deep Dive',
  'SQL for Developers',
  'Freelancing 101',
  'Docker for Beginners',
  'AI Tools for Developers ↑New',
];
