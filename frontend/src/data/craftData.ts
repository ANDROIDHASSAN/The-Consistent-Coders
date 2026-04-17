/**
 * Craft Data (Learning Paths)
 * Purpose: Contains structured learning path data for the "Learn" section.
 * Organized into three difficulty tracks: Beginner, Intermediate, and Advanced.
 * Each track contains detailed course information including pitfalls, resources,
 * and estimated durations to guide learners through their coding journey.
 */
import type { CraftCard } from '../types/index.js';

/**
 * Beginner Track
 * Purpose: Foundation courses for new developers covering web fundamentals,
 * JavaScript basics, and version control with Git
 */
export const beginnerTrack: CraftCard[] = [
  {
    id: 'lp-webfundamentals',
    tag: 'BEGINNER',
    title: 'Web Fundamentals',
    desc: 'The complete foundation of every web developer: HTML structure, CSS styling, and JavaScript logic. You\'ll build your first three real projects and understand how the internet actually works.',
    libs: 'HTML5,CSS3,JavaScript ES6',
    pitfalls: [
      'Build 3 projects before moving on',
      'Focus on responsive design from day 1',
      'Learn Git and GitHub before week 2',
      'Don\'t skip CSS Flexbox and Grid — they are essential',
    ],
    example: 'Estimated duration: 4–6 weeks. Resources: MDN Docs, FreeCodeCamp, TCC curated video playlist. Next Step: JavaScript Deep Dive.',
    video: 'qz0aGYrrlhU',
  },
  {
    id: 'lp-js',
    tag: 'BEGINNER',
    title: 'JavaScript Deep Dive',
    desc: 'Move beyond syntax into real JavaScript thinking: closures, async/await, the event loop, DOM manipulation, and building interactive features from scratch.',
    libs: 'JavaScript,NodeJS,BrowserAPIs',
    pitfalls: [
      'Practice with real mini-projects, not just exercises',
      'Understand callbacks before Promises',
      'Don\'t skip array methods — map, filter, reduce are everywhere',
      'Read the MDN docs when stuck, not just Stack Overflow',
    ],
    example: 'Estimated duration: 6–8 weeks. Resources: javascript.info, TCC JS Series, Eloquent JavaScript. Next Step: Pick React or Backend.',
    video: 'W6NZfCO5SIk',
  },
  {
    id: 'lp-git',
    tag: 'BEGINNER',
    title: 'Git & Collaboration',
    desc: 'Every professional uses Git daily. Learn version control, branching strategies, pull requests, and how to collaborate effectively on GitHub — the skill that unlocks team projects.',
    libs: 'Git,GitHub,Terminal Basics',
    pitfalls: [
      'Commit often with meaningful messages',
      'Never work directly on main/master',
      'Learn to resolve merge conflicts early',
      'Use GitHub Issues to track your work',
    ],
    example: 'Estimated duration: 1–2 weeks. Resources: TCC Git Workshop recording, Atlassian Git tutorials, GitHub Skills. Next Step: Join a team project!',
  },
];

/**
 * Intermediate Track
 * Purpose: Advanced courses for developers ready to specialize in frontend,
 * backend, UI/UX design, or DevOps practices
 */
export const intermediateTrack: CraftCard[] = [
  {
    id: 'lp-react',
    tag: 'INTERMEDIATE',
    title: 'React & Frontend Frameworks',
    desc: 'Learn component-based thinking with React. Build dynamic, stateful UIs with hooks, context, routing (React Router), and connect to APIs. This is what most frontend jobs require.',
    libs: 'React,React Router,Tailwind CSS,Vite',
    pitfalls: [
      'Understand state before learning Redux',
      'Practice useEffect correctly — common interview question',
      'Build 2-3 full projects, not just tutorials',
      'Learn TypeScript basics alongside React',
    ],
    example: 'Estimated duration: 8–10 weeks. Resources: React Docs (new), TCC React series, Scrimba React course. Next Step: Full-Stack or Advanced React patterns.',
  },
  {
    id: 'lp-backend',
    tag: 'INTERMEDIATE',
    title: 'Backend & APIs',
    desc: 'Build the server side: Node.js, Express APIs, databases (MongoDB or PostgreSQL), authentication (JWT/sessions), and REST API design. Understand how data flows through a full application.',
    libs: 'Node.js,Express,MongoDB,PostgreSQL,JWT',
    pitfalls: [
      'Never hardcode API keys — use environment variables',
      'Learn SQL fundamentals regardless of your DB choice',
      'Build authentication from scratch at least once',
      'Practice API design with Postman before frontend integration',
    ],
    example: 'Estimated duration: 8–10 weeks. Resources: TCC Backend Series, The Odin Project, Node.js official docs. Next Step: Full-Stack project deployment.',
  },
  {
    id: 'lp-uiux',
    tag: 'INTERMEDIATE',
    title: 'UI/UX & Design Systems',
    desc: 'For designers and developers alike: Figma, design tokens, component libraries, accessibility (WCAG), and how to translate design intent into production code.',
    libs: 'Figma,Design Tokens,Accessibility,CSS Variables',
    pitfalls: [
      'Design in Figma before coding',
      'Learn accessibility — it\'s not optional in production',
      'Study real design systems: Material, Radix, Shadcn',
      'Get a developer to code-review your design handoffs',
    ],
    example: 'Estimated duration: 6–8 weeks. Resources: TCC Design Track, Figma official tutorials, Refactoring UI book. Next Step: Design-to-code projects.',
  },
  {
    id: 'lp-devops',
    tag: 'INTERMEDIATE',
    title: 'DevOps & Deployment',
    desc: 'Ship real projects: CI/CD pipelines, Docker basics, deploying to Vercel/Railway/AWS, domain configuration, environment management, and monitoring production apps.',
    libs: 'Docker,Vercel,Railway,GitHub Actions,Nginx',
    pitfalls: [
      'Always use .env files, never commit secrets',
      'Learn to read server logs — they tell you everything',
      'Test your deployment pipeline before launch day',
      'Set up basic monitoring (uptime checks) for every project',
    ],
    example: 'Estimated duration: 3–4 weeks. Resources: TCC DevOps Workshop series, Fireship Docker crash course. Next Step: Full-stack team project!',
  },
];

/**
 * Advanced Track
 * Purpose: Expert-level courses for senior engineers covering system design,
 * architecture patterns, and technical interview preparation
 */
export const advancedTrack: CraftCard[] = [
  {
    id: 'lp-systemdesign',
    tag: 'ADVANCED',
    title: 'System Design & Architecture',
    desc: 'Think like a senior engineer. Learn how large-scale systems are designed: databases at scale, caching strategies (Redis), microservices vs monoliths, message queues, and how to communicate technical decisions.',
    libs: 'System Design,Redis,Message Queues,Load Balancers,CDN',
    pitfalls: [
      'Start with simple monolith, scale only when needed',
      'Understand trade-offs — there is no perfect architecture',
      'Practice explaining systems out loud (used in senior interviews)',
      'Study real post-mortems from Netflix, Slack, GitHub',
    ],
    example: 'Estimated duration: 8–12 weeks. Resources: Grokking System Design, ByteByteGo newsletter, TCC Advanced Series. Target: Senior roles, staff engineering track.',
  },
  {
    id: 'lp-dsa',
    tag: 'ADVANCED',
    title: 'DSA & Interview Prep',
    desc: 'Crack technical interviews at top companies. Data structures, algorithms, time/space complexity, and a structured 90-day interview preparation plan used by TCC members who\'ve landed at FAANG and top startups.',
    libs: 'LeetCode,NeetCode,DSA Patterns,Mock Interviews',
    pitfalls: [
      'Focus on patterns, not memorizing solutions',
      'Do easy before medium before hard',
      'Practice explaining your thought process out loud',
      'Review your wrong answers — the lesson is there, not in correct ones',
    ],
    example: 'Estimated duration: 3–6 months. Resources: TCC DSA Series, NeetCode 150, Blind 75. Members who complete this track: 3× higher offer rate.',
  },
];

/**
 * Resource Formats
 * Purpose: Lists all available learning resource types offered by TCC
 */
export const resourceFormats = [
  'Video Courses',
  'Written Guides',
  'Live Sessions',
  'Project Templates',
  'Code Reviews',
  'Community Q&A',
  'AI-Assisted Learning ↑New',
];
