# Aegis AI (InsiderGuardian) - Comprehensive Project Plan

## 🎯 Project Overview
Aegis AI is an intelligent Security Information and Event Management (SIEM) system and Web Vulnerability Scanner. It uses an AI Model to analyze server logs, detect anomalies (SQLi, XSS, Path Traversal), and monitor web assets in real-time.

## 🛠️ Technology Stack
### Frontend (Client-Side)
- **Framework:** React 18 + TypeScript + Vite.
- **Styling:** Tailwind CSS (Dark Cyber Theme + Glassmorphism/Neo-brutalism).
- **Animations:** Framer Motion & GSAP.
- **State Management:** Zustand + React Query.
- **Routing:** React Router v6.
- **Charts/Data Vis:** Recharts.

### Backend (Server-Side & AI Engine)
- **Main Framework:** Node.js with Express (Fast, handles WebSockets and AI integration efficiently).
- **AI Integration:** Node.js interacting with the local AI Model (e.g., using the `ollama` npm package for LLM-based log analysis, or TensorFlow.js).
- **Database (NoSQL):** MongoDB and Mongoose (For storing User accounts, Projects, Settings, and massive amounts of raw server logs).
- **Real-time Communication:** Socket.io (Pushing live alerts from BE to FE).

---

## 📅 Execution Phases (Granular Steps for AI Agents)

### Phase 1: Architecture & Backend Foundation (Node.js)
- [ ] **Step 1.1:** Initialize Node.js Express repository with TypeScript. Set up ESLint and Prettier.
- [ ] **Step 1.2:** Configure MongoDB database connection using Mongoose.
- [ ] **Step 1.3:** Define Database Schema (Users, Assets/Domains, Alerts, Scan_Reports).
- [ ] **Step 1.4:** Implement Authentication System (JWT-based Registration, Login, Middleware for protected routes).
- [ ] **Step 1.5:** Initialize Socket.io server for real-time bi-directional communication.

### Phase 2: AI Engine & Core Logic (Node.js)
- [ ] **Step 2.1:** Build the `Log Ingestion API`: An Express endpoint that receives raw logs from target servers.
- [ ] **Step 2.2:** Integrate the AI Model: Set up the connection between the Node.js server and the AI model (e.g., using `ollama.chat` to send log batches and ask the model to identify anomalies).
- [ ] **Step 2.3:** Build the Alert Trigger Logic: Parse the AI model's response. If the model flags a log as 'High/Critical', save it to the DB and emit a Socket.io event to the Frontend.
- [ ] **Step 2.4:** Build the `Vulnerability Scanner` utility in Node.js (e.g., automated payload testing or using headless browsers like Puppeteer) and expose it via an API endpoint.

### Phase 3: Frontend Foundation & Setup
- [ ] **Step 3.1:** Initialize Vite React TS project (`npm create vite@latest frontend -- --template react-ts`).
- [ ] **Step 3.2:** Install and configure Tailwind CSS. Set up `tailwind.config.js` with the custom Cyber Theme colors.
- [ ] **Step 3.3:** Set up Folder Structure (`src/components`, `src/pages`, `src/layouts`, `src/services`, `src/store`).
- [ ] **Step 3.4:** Configure React Router with two main layouts: `LandingLayout` and `DashboardLayout`.
- [ ] **Step 3.5:** Set up Axios instance with base URL and JWT interceptors for API calls.

### Phase 4: Frontend - Public Pages & Auth
- [ ] **Step 4.1:** Build `Navbar` and `Footer` components with glassmorphism effects.
- [ ] **Step 4.2:** Build `Home Page (/)`: Hero section with GSAP animations, Key Features, and Call-to-Action.
- [ ] **Step 4.3:** Build `AI Engine Page (/ai-engine)`: Explain the AI workflow visually.
- [ ] **Step 4.4:** Build `Pricing Page (/pricing)`: 3 tiers using modern cards.
- [ ] **Step 4.5:** Build `Signup Page (/signup)`: Form with validation (Zod + React Hook Form), connecting to BE `/api/auth/register`.
- [ ] **Step 4.6:** Build `Login Page (/login)`: Form connecting to `/api/auth/login`, storing JWT, and updating Zustand state.

### Phase 5: Frontend - Dashboard Core (The Workspace)
- [ ] **Step 5.1:** Build `DashboardLayout`: Sidebar with navigation links and a Topbar.
- [ ] **Step 5.2:** Build `Overview Page (/dashboard/overview)`: Fetch and display aggregate stats. Implement Recharts for the attack timeline.
- [ ] **Step 5.3:** Build `Live Alerts Page (/dashboard/live-alerts)`: 
    - Create a Data Table component.
    - Connect to Socket.io to push new rows into the table in real-time.
    - Add color-coded badges based on severity.
- [ ] **Step 5.4:** Build `Assets Management (/dashboard/assets)`: CRUD operations to add/remove domains.

### Phase 6: Frontend - Advanced Analysis & AI Tools
- [ ] **Step 6.1:** Build `Log Analyzer (/dashboard/log-analyzer)`: Interface to query Elasticsearch/MongoDB. Add filters and display raw JSON securely.
- [ ] **Step 6.2:** Build `Vulnerability Scanner (/dashboard/scanner)`: Input field for URL, trigger BE scan endpoint, and render the report.
- [ ] **Step 6.3:** Build `AI Training (/dashboard/ai-training)`: Interface to review AI decisions and send "True/False Positive" feedback back to the Node.js API to tune the prompts/model.
- [ ] **Step 6.4:** Build `Settings Page (/dashboard/settings)`: Update profile and configure rules.

### Phase 7: UI/UX Polish & Performance
- [ ] **Step 7.1:** Apply global Framer Motion page transitions.
- [ ] **Step 7.2:** Refine Glassmorphism CSS classes.
- [ ] **Step 7.3:** Implement loading skeletons and error boundaries.
- [ ] **Step 7.4:** Ensure 100% responsiveness across all devices.

### Phase 8: Deployment & DevOps
- [ ] **Step 8.1:** Dockerize the Node.js Full Backend.
- [ ] **Step 8.2:** Set up a CI/CD pipeline.
- [ ] **Step 8.3:** Deploy Frontend (e.g., Vercel, Netlify).
- [ ] **Step 8.4:** Deploy Node.js Backend to a VPS (e.g., DigitalOcean, AWS) ensuring the AI Model environment (like Ollama) is configured on the server.