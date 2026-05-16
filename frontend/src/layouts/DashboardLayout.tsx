import React, { useRef, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/ui/AnimatedBackground";
import { useAuthStore } from "../store/authStore";


import Overview from "../pages/Overview";
import FolderScanner from "../pages/FolderScanner";
import LogAnalyzer from "../pages/LogAnalyzer";
import Scanner from "../pages/Scanner";
import AITraining from "../pages/AITraining";
import AIChat from "../pages/AIChat";
import PhishingAnalyzer from "../pages/PhishingAnalyzer";






function TabPanel({
  path,
  activePath,
  children,
}: {
  path: string;
  activePath: string;
  children: React.ReactNode;
}) {
  const active = path === activePath;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);

  
  useEffect(() => {
    if (active && scrollRef.current) {
      scrollRef.current.scrollTop = scrollPosRef.current;
    }
  }, [active]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        if (active) scrollPosRef.current = e.currentTarget.scrollTop;
      }}
      className={`absolute inset-0 overflow-y-auto p-6
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-white/10
        hover:[&::-webkit-scrollbar-thumb]:bg-white/20
        ${active ? "block z-10" : "hidden z-0 pointer-events-none"}`}
    >
      {children}
    </div>
  );
}




function RequireRole({ allowed, children }: { allowed: string[]; children: React.ReactNode }) {
  const { user, isAuthLoading } = useAuthStore();
  
  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center">Verifying secure session...</div>;
  }

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/dashboard/overview" replace />;
  }
  return <>{children}</>;
}

export default function DashboardLayout() {
  const { user, isAuthLoading, verifySession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  if (isAuthLoading) {
    return <div className="flex h-screen items-center justify-center">Verifying secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const path = location.pathname;

  if (path === "/dashboard" || path === "/dashboard/") {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-aegis-bg">
      <AnimatedBackground />
      <div className="relative z-10 flex w-full">
        <Sidebar />
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <main className="relative h-full overflow-hidden">
            <TabPanel path="/dashboard/overview" activePath={path}>
              <Overview />
            </TabPanel>
            <TabPanel path="/dashboard/folder-scanner" activePath={path}>
              <FolderScanner />
            </TabPanel>
            <TabPanel path="/dashboard/log-analyzer" activePath={path}>
              <LogAnalyzer />
            </TabPanel>
            <TabPanel path="/dashboard/scanner" activePath={path}>
              <Scanner />
            </TabPanel>
            <TabPanel path="/dashboard/ai-training" activePath={path}>
              <RequireRole allowed={["admin"]}>
                <AITraining />
              </RequireRole>
            </TabPanel>
            <TabPanel path="/dashboard/ai-chat" activePath={path}>
              <AIChat />
            </TabPanel>
            <TabPanel path="/dashboard/phishing-analyzer" activePath={path}>
              <PhishingAnalyzer />
            </TabPanel>
          </main>
        </div>
      </div>
    </div>
  );
}
