# The Consistent Coders - Complete Project Documentation

## 📋 Project Overview
**The Consistent Coders (TCC)** is a community-driven learning platform for developers. It provides structured learning paths, live sessions, project collaboration, job opportunities, and a hall of fame to recognize active contributors.

**Tech Stack:**
- **Frontend:** React 19, TypeScript, Vite, React Router
- **Styling:** Tailwind CSS, Custom CSS
- **Animations:** GSAP, Lenis (smooth scroll), Barba.js (page transitions)
- **Backend:** Node.js, Express, MongoDB
- **Authentication:** Google OAuth 2.0, JWT
- **Deployment:** Vercel (Frontend), Railway/AWS (Backend)

---

## 📁 Project Structure

### **Root Level**
```
├── frontend/          # React frontend application
├── backend/           # Node.js/Express API server
├── api/               # Vercel serverless functions
├── .github/           # GitHub workflows and CI/CD
└── PROJECT_DOCUMENTATION.md  # This file
```

---

## 🎨 Frontend Structure (`frontend/src/`)

### **Core Files**

#### `main.tsx`
- **Purpose:** Application entry point
- **Function:** Initializes React, imports global styles, renders root App component

#### `App.tsx`
- **Purpose:** Root component with routing and providers
- **Key Functions:**
  - `ProtectedRoute`: Wraps authenticated routes, shows login modal if not logged in
  - `handleSuccess`: Processes Google OAuth login
  - `AppContent`: Main content with animations and routing
  - `toggleMenu/closeMenu`: Menu state management
- **Effects:**
  - Mobile optimizations initialization
  - Scroll to top on route change
  - Escape key menu closing
  - Magnetic hover effects
  - Scroll progress bar
  - Background color transitions
  - Navbar hide/show on scroll

---

### **Context (`context/`)**

#### `AuthContext.tsx`
- **Purpose:** Global authentication state management
- **Functions:**
  - `login(token, user)`: Stores auth data in state and localStorage
  - `logout()`: Clears all auth data
  - `useAuth()`: Custom hook to access auth context
- **Features:**
  - JWT token validation
  - Persistent authentication across page refreshes
  - Login modal state management

---

### **Hooks (`hooks/`)**

#### `useLenis.ts`
- **Purpose:** Smooth scrolling with Lenis library
- **Features:**
  - Momentum-based scrolling
  - GSAP ScrollTrigger integration
  - Custom easing curves
  - Auto-resize on window changes

#### `useBarba.ts`
- **Purpose:** Page transition animations with Barba.js
- **Features:**
  - Curtain-style transitions between routes
  - Prevents transitions on external links
  - Scroll position reset on page change
  - ScrollTrigger refresh after transitions

#### `useScrollTrigger.ts`
- **Purpose:** Safe GSAP ScrollTrigger management
- **Features:**
  - Automatic cleanup on unmount
  - Optional delayed initialization
  - Custom cleanup function support

#### `useSmoothScroll.ts`
- **Purpose:** Advanced smooth scrolling with Lenis + Locomotive Scroll
- **Features:**
  - Configurable duration and lerp
  - Optional Locomotive Scroll integration
  - RAF-based animation loop

---

### **Data (`data/`)**

#### `craftData.ts`
- **Purpose:** Learning path content
- **Exports:**
  - `beginnerTrack`: Foundation courses (HTML, CSS, JS, Git)
  - `intermediateTrack`: Specialization (React, Backend, UI/UX, DevOps)
  - `advancedTrack`: Expert level (System Design, DSA)
  - `resourceFormats`: Available learning resource types

#### `fameData.ts`
- **Purpose:** Hall of Fame / Leaderboard data
- **Exports:**
  - `fameData`: Top 5 contributors with stats and badges
  - `leaderboardData`: Simplified leaderboard with scores

#### `jobsData.ts`
- **Purpose:** Job and internship listings
- **Exports:**
  - `jobsData`: Active job postings with metadata

#### `sessionsData.ts`
- **Purpose:** Live sessions and workshops
- **Exports:**
  - `upcomingSessions`: Scheduled events with registration info
  - `pastRecordings`: Archive of previous sessions

---

### **Components (`components/`)**

#### Navigation Components
- **`Navbar.tsx`**: Main navigation bar with scroll hide/show
- **`FullscreenMenu.tsx`**: Animated fullscreen menu overlay
- **`ProfileDropdown.tsx`**: User profile menu for authenticated users

#### Page Sections
- **`Hero.tsx`**: Homepage hero section with animations
- **`Vision.tsx`**: Mission and vision statement
- **`Stats.tsx`**: Community statistics display
- **`HowItWorks.tsx`**: Platform explanation section
- **`Comparator.tsx`**: Before/After comparison slider
- **`Craft.tsx`**: Learning paths display
- **`Sessions.tsx`**: Upcoming workshops and events
- **`Fame.tsx`**: Hall of Fame / Leaderboard
- **`Jobs.tsx`**: Job listings display
- **`JoinCTA.tsx`**: Call-to-action for joining community
- **`Footer.tsx`**: Site footer with links
- **`Marquee.tsx`**: Scrolling text animation

#### Utility Components
- **`CustomCursor.tsx`**: Custom animated cursor
- **`ErrorBoundary.tsx`**: Error handling wrapper
- **`BarbaWrapper.tsx`**: Barba.js integration wrapper
- **`SmoothScroll.tsx`**: Smooth scroll wrapper
- **`GoogleLoginModal.tsx`**: Google OAuth login modal
- **`CraftModal.tsx`**: Learning path detail modal

---

### **Pages (`pages/`)**

#### `HomePage.tsx`
- **Purpose:** Landing page with all main sections
- **Sections:** Hero, Vision, Stats, HowItWorks, Comparator, Craft, Sessions, Fame, Jobs, JoinCTA

#### `LearnPage.tsx`
- **Purpose:** Detailed learning paths and resources
- **Features:** Beginner, Intermediate, Advanced tracks

#### `BuildPage.tsx`
- **Purpose:** Project showcase and collaboration
- **Features:** Active projects, contribution guidelines

#### `JoinPage.tsx`
- **Purpose:** Community onboarding
- **Features:** Discord integration, getting started guide

#### `TasksPage.tsx` (Currently Disabled)
- **Purpose:** Task management for members
- **Status:** Under development, temporarily commented out

#### `ContributorsPage.tsx`
- **Purpose:** Full contributor list and recognition

#### `JobsPage.tsx`
- **Purpose:** Comprehensive job board

#### `ContactPage.tsx`
- **Purpose:** Contact form and social links

#### `ProfilePage.tsx` (Protected)
- **Purpose:** User profile and progress tracking
- **Requires:** Authentication

#### `SettingsPage.tsx` (Protected)
- **Purpose:** User settings and preferences
- **Requires:** Authentication

#### `NotFoundPage.tsx`
- **Purpose:** 404 error page

---

### **Utils (`utils/`)**

#### `mobileOptimizations.ts`
- **Purpose:** Mobile-specific performance optimizations
- **Features:** Touch event handling, viewport fixes

#### `gsapHelpers.ts`
- **Purpose:** Reusable GSAP animation utilities
- **Features:** Common animation patterns

#### `smoothScroll.ts`
- **Purpose:** Smooth scroll utility functions
- **Features:** Scroll-to-element helpers

#### `splitTypeHelper.ts`
- **Purpose:** Text splitting for character animations
- **Features:** SplitType library integration

#### `TextScramble.ts`
- **Purpose:** Text scramble animation effect
- **Features:** Matrix-style text reveal

---

### **SEO (`seo/`)**

#### `SEOMeta.tsx`
- **Purpose:** Dynamic SEO meta tags
- **Features:** Title, description, keywords, Open Graph tags

---

### **Types (`types/`)**

#### `index.ts`
- **Purpose:** TypeScript type definitions
- **Exports:** CraftCard, FameCard, JobCard, LeaderboardEntry, etc.

#### `barba.d.ts`
- **Purpose:** Barba.js type declarations

---

### **Transitions (`transitions/`)**

#### `barbaTransitions.ts`
- **Purpose:** Barba.js transition configurations
- **Features:** Custom transition animations

---

## 🔧 Backend Structure (`backend/src/`)

### **Entry Point**

#### `index.ts`
- **Purpose:** Express server initialization
- **Features:**
  - CORS configuration
  - MongoDB connection
  - Route mounting
  - Error handling middleware

---

### **API Routes (`api/routes/`)**

#### Authentication Routes
- **`POST /api/auth/google`**: Google OAuth login
- **`POST /api/auth/logout`**: User logout
- **`GET /api/auth/me`**: Get current user

#### User Routes
- **`GET /api/users/:id`**: Get user profile
- **`PUT /api/users/:id`**: Update user profile

---

### **Models (`api/models/`)**

#### `User.ts`
- **Purpose:** MongoDB user schema
- **Fields:** id, name, email, picture, role, createdAt, updatedAt

---

### **Middleware (`api/middlewares/`)**

#### `error.middleware.ts`
- **Purpose:** Global error handling
- **Features:** Consistent error responses, logging

---

## 🎯 Key Features

### 1. **Authentication System**
- Google OAuth 2.0 integration
- JWT token-based authentication
- Protected routes with login modal
- Persistent sessions via localStorage

### 2. **Smooth Animations**
- GSAP for scroll-based animations
- Lenis for buttery-smooth scrolling
- Barba.js for page transitions
- Custom cursor with magnetic effects

### 3. **Learning Paths**
- Structured tracks (Beginner → Intermediate → Advanced)
- Detailed course information with pitfalls
- Video resources and project templates

### 4. **Community Features**
- Hall of Fame / Leaderboard
- Live sessions and workshops
- Job board for members
- Contributor recognition

### 5. **Responsive Design**
- Mobile-first approach
- Touch-optimized interactions
- Adaptive layouts

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account
- Google OAuth credentials

### Installation

```bash
# Clone repository
git clone https://github.com/ANDROIDHASSAN/The-Consistent-Coders.git
cd The-Consistent-Coders

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Environment Variables

**Frontend (`.env`):**
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Backend (`.env`):**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PORT=5000
```

### Running the Application

```bash
# Frontend (http://localhost:5174)
cd frontend
npm run dev

# Backend (http://localhost:5000)
cd backend
npm run dev
```

---

## 📦 Build & Deployment

### Frontend Build
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Backend Build
```bash
cd backend
npm run build
# Output: backend/dist/
```

### Deployment
- **Frontend:** Vercel (automatic deployment from `features` branch)
- **Backend:** Railway or AWS EC2
- **Database:** MongoDB Atlas

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Code Comments Guide

All major functions and components now include:
- **Purpose:** What the function/component does
- **Parameters:** Input parameters and their types
- **Returns:** Return values and types
- **Features:** Key capabilities
- **Effects:** Side effects and lifecycle hooks

---

## 🐛 Known Issues

1. **Tasks Page:** Currently disabled (under development)
2. **Mobile Menu:** Occasional animation glitch on slow devices
3. **Scroll Performance:** May lag on very long pages

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Hassan** - Project Lead & Full-Stack Developer
- **Yash Mahajan** - React Mentor
- **Atharva Rahate** - UI/UX Lead
- **Prathamesh Ranade** - Backend Architect
- **Sarthak Kanade** - Content Creator
- **Onkar Shinde** - Full-Stack Developer

---

## 📞 Contact

- **Email:** consistentcoders@gmail.com
- **Discord:** [Join our community](#)
- **GitHub:** [The-Consistent-Coders](https://github.com/ANDROIDHASSAN/The-Consistent-Coders)

---

**Last Updated:** April 17, 2026
**Version:** 2.0.0
