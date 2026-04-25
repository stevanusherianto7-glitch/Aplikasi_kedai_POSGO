import * as React from "react";
import { Home, Package, UtensilsCrossed, Users, Bell, Download, Sun, Moon, Database } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { usePWAInstall } from "@/hooks/usePWAInstall";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isModalOpen?: boolean;
  hideNavbar?: boolean;
}

export function Layout({ children, activeTab, onTabChange, theme, toggleTheme, isModalOpen = false, hideNavbar = false }: LayoutProps) {
  const { canInstall, installApp } = usePWAInstall();
  
  const menuGroups = [
    {
      title: "OPERASIONAL",
      items: [
        { id: "home", label: "Home", icon: Home },
      ]
    },
    {
      title: "ADMINISTRASI",
      items: [
        { id: "karyawan", label: "SDM", icon: Users },
      ]
    }
  ];

  const allTabs = menuGroups.flatMap(group => group.items);

  return (
    <div className={cn(
      "flex h-[100dvh] w-full overflow-hidden font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-[#0a0a0c]" : "bg-[var(--background)]"
    )}>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col w-64 shrink-0 z-20 border-r transition-colors duration-500",
        theme === 'dark' ? "bg-black border-white/5" : "bg-white border-slate-100"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/10">
              <Logo size={32} className="brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black leading-none tracking-tight text-slate-900 dark:text-white italic">
                POS<span className="text-blue-500 not-italic">GO</span>
              </h1>
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 text-slate-500 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-6 mt-2 overflow-y-auto no-scrollbar pb-10">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h2 className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 opacity-60">
                {group.title}
              </h2>
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        "flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 relative group",
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 transition-transform duration-200", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-6 space-y-3 border-t border-slate-50 dark:border-white/5">
          {canInstall && (
            <button 
              onClick={installApp}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all active:scale-95"
            >
              <Download className="w-3 h-3" />
              INSTALL PWA
            </button>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-[10px]">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-900 truncate">Admin POSGO</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto no-scrollbar pb-32 lg:pb-0 relative z-10 scrolling-touch">
          <div className={cn(
            "mx-auto px-0 transition-all duration-500",
            (activeTab === "home" || activeTab === "bahan" || activeTab === "karyawan" || activeTab === "kasirgo" || activeTab === "restaurant-assets") ? "py-0 max-w-none" : "py-8 lg:py-12 max-w-7xl"
          )}>
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Premium God Mode */}
        {activeTab !== 'kasirgo' && !isModalOpen && !hideNavbar && (
          <nav className={cn(
            "lg:hidden fixed bottom-6 left-0 right-0 z-40 h-20 px-6 mx-6 rounded-[2rem] border backdrop-blur-2xl flex items-center justify-around shadow-2xl transition-all duration-500",
            theme === 'dark' ? "bg-black/60 border-white/10 shadow-black/40" : "bg-white/80 border-slate-200 shadow-slate-200/50"
          )}>
            {menuGroups.flatMap(g => g.items).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const iceBlue = "#3b82f6"; // Primary Blue for Ice theme

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="relative flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300"
                >
                  <div className={cn(
                    "relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300",
                    isActive
                      ? "scale-110"
                      : (theme === 'dark' ? "text-slate-500 hover:bg-white/5" : "text-slate-400 hover:bg-slate-50")
                  )}
                  style={isActive ? { color: iceBlue } : {}}
                  >
                    <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
                  </div>

                  <span className={cn(
                    "relative z-10 text-[8px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                    !isActive && "text-slate-500 opacity-60"
                  )}
                  style={isActive ? { color: iceBlue } : {}}
                  >
                    {tab.label}
                  </span>

                  {/* Subtle Neon Line Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabLine"
                      className="absolute -bottom-1 w-5 h-0.5 rounded-full"
                      style={{ backgroundColor: iceBlue }}
                    />
                  )}
                </button>
              );
            })}

            {/* Database Sync Status Removed */}
          </nav>
        )}
      </div>
    </div>
  );
}
