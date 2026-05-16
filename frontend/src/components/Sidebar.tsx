import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  FolderSearch,
  FileSearch,
  ScanLine,
  BrainCircuit,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  MailWarning,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const navigation: NavItem[] = [
  { label: "Overview", to: "/dashboard/overview", icon: LayoutDashboard },
  { label: "Folder Scanner", to: "/dashboard/folder-scanner", icon: FolderSearch },
  { label: "Log Analyzer", to: "/dashboard/log-analyzer", icon: FileSearch },
  { label: "Code Scanner", to: "/dashboard/scanner", icon: ScanLine },
  { label: "AI Training", to: "/dashboard/ai-training", icon: BrainCircuit },
  { label: "AI Chat", to: "/dashboard/ai-chat", icon: MessageSquare },
  { label: "Phishing", to: "/dashboard/phishing-analyzer", icon: MailWarning },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("aegis_auth_store");
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.to}
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 no-underline overflow-hidden ${
            collapsed ? "justify-center" : ""
          } ${
            isActive
              ? "bg-[#00d4c3]/10 text-aegis-primary border-l-2 border-[#00d4c3] shadow-[inset_2px_0_8px_rgba(0,212,195,0.1)]"
              : "text-aegis-muted hover:bg-white/[0.04] hover:text-aegis-text border-l-2 border-transparent"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={`h-[18px] w-[18px] shrink-0 transition-transform duration-300 ${
                !isActive ? "group-hover:scale-110" : ""
              }`}
            />
            {!collapsed && <span>{item.label}</span>}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-white/5 bg-aegis-surface/50 backdrop-blur-md transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      <NavLink
        to="/"
        end
        className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/5 px-4 no-underline transition-colors hover:bg-white/[0.03]"
        title={collapsed ? "Aegis AI Home" : undefined}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aegis-primary/10">
          <Shield className="h-5 w-5 text-aegis-primary" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-aegis-text">
            Aegis <span className="text-aegis-primary">AI</span>
          </span>
        )}
      </NavLink>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <span className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-aegis-muted/40 uppercase">
              Main Menu
            </span>
          )}
          <NavLink
            to="/"
            end
            title={collapsed ? "Home Page" : undefined}
            className={({ isActive }) =>
              `group relative mb-2 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium no-underline transition-all duration-300 ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "border-aegis-primary/50 bg-aegis-primary/10 text-aegis-primary"
                  : "border-white/15 text-aegis-muted hover:border-aegis-primary/35 hover:bg-aegis-primary/10 hover:text-aegis-primary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Home
                  className={`h-[18px] w-[18px] shrink-0 transition-transform duration-300 ${
                    !isActive ? "group-hover:scale-110" : ""
                  }`}
                />
                {!collapsed && <span>Home Page</span>}
              </>
            )}
          </NavLink>
          {navigation.map(renderLink)}
        </div>

        <div className="flex flex-col gap-1 border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`group relative mt-1 flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-aegis-muted transition-all duration-300 hover:bg-aegis-critical/10 hover:text-aegis-critical hover:border-aegis-critical/40 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      <div className="border-t border-white/5 p-3 shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-aegis-muted transition-all duration-300 hover:bg-white/[0.04] hover:text-aegis-text ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
