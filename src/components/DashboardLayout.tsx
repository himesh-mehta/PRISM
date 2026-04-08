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
    <div className="min-h-screen bg-[#eef2f7] dark:bg-[#020617] text-foreground dark:text-white transition-colors duration-500">
      {/* Top Navigation */}
      <header
        className="fixed top-0 left-0 right-0 z-[50] transition-all duration-300 ease-in-out border-b py-3 bg-[#0a0f1d]/95 backdrop-blur-xl shadow-elevated border-white/10"
      >
        <div className="w-full flex items-center justify-between px-6 lg:px-12 relative h-10">
          {/* Left: Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-3 group shrink-0 relative z-10 transition-transform hover:scale-105">
            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-display font-bold text-xl">P</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight transition-colors duration-300 text-white">
              Prism
            </span>
          </button>

          {/* Center: Nav Box (desktop) - Flex Centered to prevent overlap */}
          <div className="hidden lg:flex flex-1 justify-center mx-4 min-w-0">
            <div className="flex items-center backdrop-blur-md border rounded-full px-2 py-1 transition-all duration-500 overflow-x-auto max-w-full shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-white/10 border-white/20 text-white">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 text-[10px] shrink-0 uppercase tracking-[0.15em] font-bold transition-all duration-300 rounded-full relative group whitespace-nowrap ${isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-white/90 hover:text-white hover:bg-white/10"}`}
                  >
                    <span className="relative z-10">{item.title}</span>
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -z-0 bg-white/10 group-hover:scale-105" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {/* Marathi Translation Toggle */}
            <button
              onClick={() => (window as any).translateToMarathi?.()}
              className="px-4 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              मराठी
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex w-10 h-10 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 text-white hover:text-white hover:bg-white/10"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 relative text-white hover:text-white hover:bg-white/10">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-destructive border-2 border-background dark:border-[#0a0f1d]" />
            </button>

            {/* User avatar dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full transition-all duration-300 border hover:bg-white/10 border-white/10"
              >
                <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-accent-gradient text-white text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-bold max-w-[100px] truncate transition-colors text-white">
                  {user?.name?.split(" ")[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 hidden md:block transition-colors text-white" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 z-50 w-56 bg-card rounded-2xl border border-border shadow-elevated p-2"
                    >
                      <div className="px-3 py-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isDoctor
                            ? `${user.specialization || 'Doctor'}`
                            : `BMI: ${user?.bmi} · ${user?.bodyType}`}
                        </p>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <button
                        onClick={() => { navigate(isDoctor ? "/doctor/settings" : "/dashboard/settings"); setUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-xl transition-colors"
                      >
                        <Settings2 className="w-4 h-4 text-muted-foreground" /> Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-secondary"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6 text-white" />
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
              className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-border shadow-elevated flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
                    <span className="text-accent-foreground font-display font-bold text-sm">P</span>
                  </div>
                  <span className="font-display font-bold text-lg text-foreground">Prism</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMobileOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-accent-gradient text-accent-foreground text-sm font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isDoctor
                        ? `${user.specialization || 'Doctor'}`
                        : `BMI: ${user?.bmi} · ${user?.bodyType}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.03)_100%)] dark:bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Main content */}
      <main className="relative pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto min-h-[calc(100vh-4rem)]">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardLayout;
