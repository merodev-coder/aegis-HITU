# Aegis AI - Context & Development Guidelines

## 1. Project Overview
**Aegis AI (InsiderGuardian)** is a modern, AI-powered Security Information and Event Management (SIEM) system and Web Vulnerability Scanner. The platform analyzes server logs via a local AI Model (integrated via Node.js) to detect anomalies (SQLi, XSS, etc.) and provides a real-time, data-dense monitoring dashboard. The entire stack is unified under Node.js and TypeScript.

## 2. Tech Stack (Strict Requirements)

### 2.1 Frontend (React + Vite)
- **Framework:** React 18 with TypeScript.
- **Styling:** Tailwind CSS (Strictly use utility classes).
- **Icons:** `lucide-react`.
- **State Management:** `Zustand` (Global UI state) + `React Query` (Server state fetching).
- **Routing:** `react-router-dom` v6.
- **Animations:** `framer-motion` (UI transitions) & `gsap` (Landing page).
- **Data Visualization:** `recharts`.
- **Forms & Validation:** `react-hook-form` + `zod`.

### 2.2 Backend (Node.js + Express)
- **Framework:** Node.js with Express.js (TypeScript).
- **AI Integration:** Groq API (`groq-sdk`) with `llama3-8b-8192` model for log analysis.
- **Real-time Engine:** `socket.io` for pushing live threats to the frontend.
- **Databases:** MongoDB (via Mongoose) for Users, Assets, Settings, and scalable log ingestion.
- **Security:** `helmet`, `cors`, JWT-based authentication.

## 3. Design System & UI/UX Guidelines
The UI must strictly follow a "Modern Cyber-Security / Glassmorphism" aesthetic.

### 3.1 Color Palette (Tailwind Config)
- **Background:** `#050505` (Deep dark background).
- **Surface/Cards:** `#111318` (Slightly lighter dark for panels/popovers).
- **Primary Accent:** `#00d4c3` (Cyan/Teal - Used for active states, primary buttons, borders).
- **Text:** - Primary: `#f4f6fb` (High contrast text).
  - Muted: `#a6acb8` (Secondary text).
- **Alert/Status Colors:**
  - Critical/Error: `#ff3b30` (Red)
  - High/Warning: `#ff9500` (Orange)
  - Medium: `#ffcc00` (Yellow)
  - Low/Success: `#00d4c3` (Teal).

### 3.2 UI Traits (Glassmorphism)
- Use subtle borders for all cards: `border border-white/5` or `border-[#00d4c3]/20`.
- Apply slight background blur: `backdrop-blur-md bg-[#111318]/80`.
- Keep layouts data-dense but readable. Use padding `p-4` or `p-6` consistently.

## 4. Architecture & Directory Structure
The project is structured into two main directories (Frontend and Backend) to maintain full-stack clarity:

/ (Root)
├── frontend/             # React Client
│   ├── src/
│   │   ├── components/   # UI, Forms, Charts
│   │   ├── layouts/      # DashboardLayout, LandingLayout
│   │   ├── pages/        # Route components
│   │   ├── services/     # Axios instances, API endpoints
│   │   └── store/        # Zustand stores
├── backend/              # Node.js Server
│   ├── src/
│   │   ├── controllers/  # Route logic
│   │   ├── middlewares/  # Auth, Error handling
│   │   ├── models/       # Prisma schema / DB models
│   │   ├── routes/       # Express routers
│   │   └── services/     # AI integration (Ollama), Socket.io logic


## 5. Coding Conventions (Rules for AI Agent)
1. **Strict TypeScript:** Do NOT use `any`. Always define interfaces/types for both Frontend and Backend. Share types where possible.
2. **Frontend UI:** Use `clsx` and `tailwind-merge` for dynamic Tailwind classes. Build mobile-first. Ensure all tables/charts are in `overflow-x-auto` containers.
3. **Real-time Data (Sockets):** Assume live alerts are pushed via Socket.io. The frontend should efficiently append new data to lists without full re-renders.
4. **Backend Controllers:** Keep controllers clean; move heavy logic (especially AI processing and log parsing) to the `services/` directory.
5. **Error Handling:** - Backend: Use a centralized error-handling middleware. Do not crash the server on failed AI generation.
   - Frontend: Always include skeleton loaders and error boundaries for API calls.