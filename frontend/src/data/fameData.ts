/**
 * Fame Data (Hall of Fame / Leaderboard)
 * Purpose: Contains contributor recognition data including top members,
 * their achievements, badges, and leaderboard rankings. Used to showcase
 * active community members and encourage participation.
 */
import type { FameCard, LeaderboardEntry } from '../types/index.js';

import yashImg from '../assets/images/yash.webp';
import atharvaImg from '../assets/images/atharvarahate.webp';
import prathameshImg from '../assets/images/prathameshpathade.webp';
import sarthakImg from '../assets/images/sarthakkanade.webp';
import onkarImg from '../assets/images/onkarshinde.webp';

/**
 * Fame Data Array
 * Purpose: Top 5 contributors with their roles, stats, and achievements
 */
export const fameData: FameCard[] = [
  {
    id: 'fame-1',
    rank: 1,
    name: 'Yash Mahajan',
    role: '// REACT MENTOR',
    avatar: yashImg,
    crown: '🥇',
    stats: {
      sessions: 12,
      projects: 3,
    },
    badges: ['🏆 Top Mentor', '🚀 Project Lead'],
  },
  {
    id: 'fame-2',
    rank: 2,
    name: 'Atharva Rahate',
    role: '// UI/UX LEAD',
    avatar: atharvaImg,
    crown: '🥈',
    stats: {
      reviews: 8,
      projects: 2,
    },
    badges: ['🎨 Design Expert', '💬 Community Voice'],
  },
  {
    id: 'fame-3',
    rank: 3,
    name: 'Prathamesh Ranade',
    role: '// BACKEND ARCHITECT',
    avatar: prathameshImg,
    crown: '🥉',
    stats: {
      sessions: 5,
      projects: 4,
    },
    badges: ['⚡ Open Source', '🔧 System Builder'],
  },
  {
    id: 'fame-4',
    rank: 4,
    name: 'Sarthak Kanade',
    role: '// CONTENT CREATOR',
    avatar: sarthakImg,
    stats: {
      resources: 20,
      projects: 1,
    },
    badges: ['📚 Knowledge Sharer', '🎥 Video Editor'],
  },
  {
    id: 'fame-5',
    rank: 5,
    name: 'Onkar Shinde',
    role: '// FULL-STACK',
    avatar: onkarImg,
    stats: {
      prs: 50,
      projects: 2,
    },
    badges: ['💻 Code Contributor', '🌟 Rising Star'],
  },
];

/**
 * Leaderboard Data
 * Purpose: Simplified leaderboard view with scores and visual width percentages
 * for animated progress bars
 */
export const leaderboardData: LeaderboardEntry[] = [
  { name: 'Yash M.', score: 2450, width: 95 },
  { name: 'Atharva R.', score: 1980, width: 78 },
  { name: 'Prathamesh R.', score: 1640, width: 65 },
  { name: 'Onkar S.', score: 1320, width: 52 },
  { name: 'Sarthak K.', score: 1010, width: 40 },
];
