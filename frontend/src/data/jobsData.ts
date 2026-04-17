/**
 * Jobs Data
 * Purpose: Contains job and internship listings for TCC members.
 * Includes full-time positions, internships, and community roles with
 * detailed metadata like location, salary, required skills, and deadlines.
 */
import type { JobCard } from '../types/index';

/**
 * Jobs Data Array
 * Purpose: Active job listings displayed on the Jobs page
 */
export const jobsData: JobCard[] = [
  {
    id: 'job-1',
    type: 'INTERNSHIP',
    badge: 'NEW',
    role: 'Frontend Developer Intern',
    company: 'TechMint Startup',
    meta: {
      location: '📍 Remote',
      duration: '⏱ 3 Months',
      salary: '💰 ₹10K/mo',
    },
    skills: ['React', 'TypeScript', 'Tailwind'],
    deadline: '// APPLY BY APR 20',
    applyLink: '#',
  },
  {
    id: 'job-2',
    type: 'FULL TIME',
    badge: 'HOT',
    role: 'Junior Backend Engineer',
    company: 'CloudBase Technologies',
    meta: {
      location: '📍 Bangalore (Hybrid)',
      salary: '💰 ₹6-8 LPA',
    },
    skills: ['Node.js', 'PostgreSQL', 'AWS'],
    deadline: '// APPLY BY APR 25',
    applyLink: '#',
  },
  {
    id: 'job-3',
    type: 'INTERNSHIP',
    badge: 'OPEN',
    role: 'UI/UX Design Intern',
    company: 'DesignFirst Agency',
    meta: {
      location: '📍 Remote',
      duration: '⏱ 6 Months',
      salary: '💰 Stipend',
    },
    skills: ['Figma', 'Prototyping', 'Research'],
    deadline: '// ROLLING BASIS',
    applyLink: '#',
  },
  {
    id: 'job-4',
    type: 'FULL TIME',
    badge: 'NEW',
    role: 'Full-Stack Developer',
    company: 'GrowthStack SaaS',
    meta: {
      location: '📍 Remote (India)',
      salary: '💰 ₹8-12 LPA',
    },
    skills: ['Next.js', 'MongoDB', 'Docker'],
    deadline: '// APPLY BY MAY 1',
    applyLink: '#',
  },
  {
    id: 'job-5',
    type: 'INTERNSHIP',
    badge: 'OPEN',
    role: 'Video Editor / Content Creator',
    company: 'TCC Internal Role',
    meta: {
      location: '📍 Remote',
      duration: '⏱ Ongoing',
      salary: '💰 Equity + Recognition',
    },
    skills: ['DaVinci', 'Premiere', 'Content Strategy'],
    deadline: '// ALWAYS OPEN',
    applyLink: '#contact',
  },
];
