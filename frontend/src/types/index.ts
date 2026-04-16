// Type definitions for the application

export interface CraftCard {
  id: string;
  tag: string;
  title: string;
  desc: string;
  libs: string;
  pitfalls: string[];
  example: string;
  video?: string;
  playlist?: string;
}

export interface JobCard {
  id: string;
  type: string;
  badge: string;
  role: string;
  company: string;
  meta: {
    location: string;
    duration?: string;
    salary: string;
  };
  skills: string[];
  deadline: string;
  applyLink: string;
}

export interface FameCard {
  id: string;
  rank: number;
  name: string;
  role: string;
  avatar: string;
  crown?: string;
  stats: {
    sessions?: number;
    projects?: number;
    reviews?: number;
    prs?: number;
    resources?: number;
  };
  badges: string[];
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  width: number;
}
