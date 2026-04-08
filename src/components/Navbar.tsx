import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

interface NavbarProps {
  onLoginClick?: () => void;
  onJoinClick?: () => void;
}

const Navbar = ({ onLoginClick, onJoinClick }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);

    // Use IntersectionObserver to detect when Hero section is out of view
    const heroSection = document.getElementById("home");
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show toggle when hero is mostly out of view
        setPastHero(!entry.isIntersecting || entry.intersectionRatio < 0.2);
      },
      { threshold: [0, 0.1, 0.2] }
    );

    if (heroSection) observer.observe(heroSection);

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (heroSection) observer.unobserve(heroSection);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-[padding,background-color,border-color,box-shadow] duration-700 ease-in-out border-b-2 ${scrolled
        ? "py-3 bg-white dark:bg-prism-navy shadow-elevated border-slate-300 dark:border-white/30"
        : "py-6 bg-transparent border-transparent"
        }`}
    >
      <div className="w-full flex items-center justify-between px-6 lg:px-12 relative">
        <a href="#home" className="flex items-center gap-3 group shrink-0 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
            <span className="text-white font-display font-bold text-xl">P</span>
          </div>
          <span className={`font-display font-bold text-2xl tracking-tight transition-colors duration-300 ${scrolled ? "text-foreground" : "text-white"}`}>
            Prism
          </span>
        </a>

        {/* Desktop Navigation - Absolutely Centered */}
        <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className={`flex items-center backdrop-blur-md border rounded-full px-2 py-1 transition-all duration-500 ${scrolled
            ? "bg-secondary/50 dark:bg-slate-800/50 text-foreground border-border/50 shadow-sm"
            : "bg-white/5 border-white/10"
            }`}>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-300 rounded-full relative group whitespace-nowrap ${scrolled
                  ? "text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  : "text-white/70 hover:text-white"
                  }`}
              >
                <span className="relative z-10">{l.label}</span>
                <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -z-0 ${scrolled
                  ? "bg-blue-600/5 group-hover:scale-105"
                  : "bg-white/10 group-hover:scale-105"
                  }`}
                />
              </a>
            ))}
          </div>
        </div>

        {/* Actions - Grouped to Extreme Right */}
        <div className="hidden md:flex items-center gap-4 relative z-10">
          {/* Marathi Translation Toggle */}
          <Button
            size="sm"
            onClick={() => (window as any).translateToMarathi?.()}
            className={`rounded-full px-5 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-xl font-semibold ${scrolled
              ? "bg-blue-600/10 text-blue-600 border-blue-600/20 hover:bg-blue-600/20"
              : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            मराठी
          </Button>

          <Button
            size="sm"
            onClick={onLoginClick}
            className={`rounded-full px-6 transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-xl ${scrolled
              ? "bg-secondary text-foreground hover:bg-secondary/80 border-border"
              : "bg-white/10 text-white hover:bg-white/20"
              }`}
          >
            Sign In
          </Button>

          <Button
            size="sm"
            onClick={onJoinClick}
            className="bg-accent-gradient text-white shadow-glow hover:shadow-elevated hover:scale-105 active:scale-95 rounded-full px-6 group transition-all duration-300"
          >
            Join Prism <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          <motion.button
            variants={{
              hidden: { opacity: 0, y: -20, scale: 0.8, pointerEvents: "none" },
              visible: { opacity: 1, y: 0, scale: 1, pointerEvents: "auto" }
            }}
            initial="hidden"
            animate={pastHero ? "visible" : "hidden"}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`w-10 h-10 flex items-center justify-center rounded-full shadow-lg active:scale-90 ring-2 transition-colors duration-500 ${theme === "dark"
              ? "bg-black text-white ring-white/10"
              : "bg-white text-black ring-black/5"}`}
          >
            {theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </motion.button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-xl bg-white/10 backdrop-blur-md"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className={scrolled ? "text-foreground" : "text-white"} />
          ) : (
            <Menu className={scrolled ? "text-foreground" : "text-white"} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-prism-navy/95 backdrop-blur-2xl border-b border-border shadow-elevated"
          >
            <div className="flex flex-col gap-2 p-6">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-4 rounded-xl hover:bg-blue-600/5 hover:text-blue-600 text-foreground font-bold text-sm uppercase tracking-wider transition-all duration-300 active:scale-95 group flex items-center justify-between"
                >
                  {l.label}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>
              ))}
              <hr className="my-2 border-border" />
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={onLoginClick} className="w-full rounded-xl">Sign In</Button>
                <Button onClick={onJoinClick} className="bg-accent-gradient text-white w-full rounded-xl shadow-glow">Join Prism</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

