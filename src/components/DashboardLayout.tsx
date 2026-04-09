import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, ScanEye, Activity, Library, Bot, BarChart3, Settings2, LogOut, User, Bell, Menu, X, ChevronDown, Sun, Moon
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  const isDoctor = user?.role === "doctor";

  const navItems = isDoctor ? [
    { title: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
    { title: "Prescriptions", path: "/doctor/prescription", icon: Activity },
    { title: "Settings", path: "/doctor/settings", icon: Settings2 },
  ] : [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { title: "Posture AI", path: "/dashboard/posture", icon: ScanEye },
    { title: "Exercise Tracker", path: "/dashboard/tracker", icon: Activity },
    { title: "Exercise Library", path: "/dashboard/library", icon: Library },
    { title: "Reports", path: "/dashboard/reports", icon: BarChart3 },
    { title: "AI Assistant", path: "/dashboard/chatbot", icon: Bot },
    { title: "Settings", path: "/dashboard/settings", icon: Settings2 },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 selection:bg-blue-500/30">
      {/* Top Navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-[50] transition-all duration-300 ease-in-out border-b py-3 bg-[#0a0f1d]/95 backdrop-blur-xl shadow-elevated border-white/10"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 lg:px-12 relative h-12">
          {/* Left: Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-3 group shrink-0 relative z-10 transition-transform active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow group-hover:rotate-6 transition-transform duration-500">
              <span className="text-white font-display font-black text-xl">P</span>
            </div>
            <span className="font-display font-black text-2xl tracking-tighter transition-colors duration-300 text-white">
              PRISM
            </span>
          </button>

          {/* Center: Nav Box (desktop) */}
          <div className="hidden lg:flex flex-1 justify-center mx-8 min-w-0">
            <div className="flex items-center backdrop-blur-md border border-white/20 rounded-2xl px-1.5 py-1.5 transition-all duration-500 overflow-x-auto max-w-full shadow-sm bg-white/10">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-5 py-2 text-[11px] shrink-0 uppercase tracking-widest font-black transition-all duration-300 rounded-xl relative group whitespace-nowrap ${isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/10"}`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                       {isActive && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-current" />}
                       {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            {/* Marathi Translation Toggle */}
            <button
              onClick={() => (window as any).translateToMarathi?.()}
              className="px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              मराठी
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex w-10 h-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-white/10 text-white/80 hover:text-white"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl transition-all duration-300 hover:bg-white/10 relative text-white/80 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 border-2 border-[#0a0f1d]" />
            </button>

            {/* User avatar dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-2xl transition-all duration-300 border border-white/20 hover:bg-white/10 shadow-sm"
              >
                <Avatar className="w-9 h-9 ring-2 ring-primary/10">
                  <AvatarFallback className="bg-accent-gradient text-white text-xs font-black">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 hidden md:block transition-colors text-white/60" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="absolute right-0 top-14 z-50 w-64 bg-card rounded-2xl border border-border shadow-elevated p-2"
                    >
                      <div className="px-4 py-3 mb-2">
                        <p className="text-sm font-black text-foreground">{user?.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                          {isDoctor
                            ? `${user.specialization || 'Doctor'}`
                            : `${user?.bodyType} · BMI ${user?.bmi}`}
                        </p>
                      </div>
                      <div className="h-px bg-border/40 mx-2 mb-2" />
                      <button
                        onClick={() => { navigate(isDoctor ? "/doctor/settings" : "/dashboard/settings"); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-foreground hover:bg-secondary rounded-xl transition-colors"
                      >
                        <Settings2 className="w-4 h-4 text-muted-foreground" /> Account Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-secondary transition-all"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[60] w-80 bg-card border-r border-border shadow-elevated flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center">
                    <span className="text-white font-display font-black text-lg">P</span>
                  </div>
                  <span className="font-display font-black text-xl tracking-tighter">PRISM</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex-1 p-6 space-y-2 overflow-y-auto premium-scrollbar">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-primary/60"}`} />
                      {item.title}
                    </button>
                  );
                })}
              </nav>

              <div className="p-6 border-t border-border space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50">
                  <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-accent-gradient text-white text-sm font-black">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{user?.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      Patient Profile
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl text-sm font-black text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] dark:opacity-20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] dark:opacity-20" />
      </div>

      {/* Main content */}
      <main className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1700px] mx-auto min-h-[calc(100vh-4rem)]">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.995, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>

  );
};

export default DashboardLayout;
