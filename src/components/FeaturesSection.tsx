import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ScanEye, Dumbbell, Library, Bot, BarChart3, Settings2, LayoutDashboard, ArrowRight, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: LayoutDashboard,
    title: "Home Dashboard",
    description: "Real-time overview of your recovery journey, upcoming sessions, and progress metrics.",
    path: "/dashboard"
  },
  {
    icon: ScanEye,
    title: "Posture Detection",
    description: "AI-powered webcam analysis detects posture deviations and provides instant correction feedback.",
    path: "/dashboard/posture"
  },
  {
    icon: Activity,
    title: "Exercise Tracker",
    description: "Webcam-based rep counting, form analysis, and real-time quality scoring of your exercises.",
    path: "/dashboard/tracker"
  },
  {
    icon: Library,
    title: "Exercise Library",
    description: "50+ curated exercises organized by body part with step-by-step instructions and difficulty levels.",
    path: "/dashboard/library"
  },
  {
    icon: Bot,
    title: "AI Chatbot with 3D Mesh",
    description: "Interactive AI assistant with a 3D body model that demonstrates exercises in real-time.",
    path: "/dashboard/chatbot"
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Detailed progress reports, pain tracking, and recovery trend analysis.",
    path: "/dashboard/reports"
  },
  {
    icon: Dumbbell,
    title: "Personalized Plans",
    description: "AI-generated therapy plans adapted to your condition, progress, and goals.",
    path: "/dashboard"
  },
  {
    icon: Settings2,
    title: "Settings & Profile",
    description: "Manage preferences, notification schedules, therapist connections, and data exports.",
    path: "/dashboard/settings"
  },
];

const showcaseSlides = [
  {
    image: "/physio_hologram_1.png",
    title: "AI Posture Analysis",
    description: "Real-time skeletal tracking ensures perfect spinal alignment during every exercise rep.",
    badge: "EXCLUSIVE TECHNOLOGY"
  },
  {
    image: "/physio_hologram_2.png",
    title: "Joint Rehabilitation",
    description: "Specialized 3D mapping for localized joint recovery and range-of-motion optimization.",
    badge: "ADVANCED DIAGNOSTICS"
  },
  {
    image: "/physio_hologram_3.png",
    title: "Recovery Analytics",
    description: "Comprehensive data visualization of your physiotherapy journey and strength gains.",
    badge: "SMART TRACKING"
  },
  {
    image: "/physio_hologram_4.png",
    title: "Muscle Engagement",
    description: "Detailed visualization of secondary muscle group activation and muscular balance.",
    badge: "BIOMETRIC FEEDBACK"
  },
  {
    image: "/physio_hologram_5.png",
    title: "AI Motion Tracking",
    description: "Intelligent form correction system that adapts to your body's unique mobility levels.",
    badge: "PERSONALIZED RECOVERY"
  }
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardVariants: any = {
  initial: {
    y: 0,
    scale: 1,
    boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.1)",
    borderColor: "rgba(0, 0, 0, 0.05)",
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  hover: {
    y: -12,
    scale: 1.04,
    backgroundColor: "hsl(var(--secondary))",
    boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.2)",
    borderColor: "rgba(59, 130, 246, 0.4)",
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const iconVariants: any = {
  initial: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  hover: {
    scale: 1.15,
    rotate: 5,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

interface FeaturesSectionProps {
  onCardClick?: (path: string) => void;
}

const FeaturesSection = ({ onCardClick }: FeaturesSectionProps) => {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % showcaseSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isHovered]);

  return (
    <section id="features" className="py-20 bg-background relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-prism-sky/5 blur-[120px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-prism-indigo/5 blur-[120px] translate-y-1/2 -translate-x-1/4" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
            Platform Capabilities
          </span>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-foreground mt-3 mb-6">
            Everything You Need to <br />
            <span className="text-gradient-hero">Recover Smarter</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            After logging in, you get access to a comprehensive suite of tools designed to accelerate your physiotherapy journey.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              onClick={() => onCardClick?.(f.path)}
              variants={item}
              className="block outline-none rounded-[2rem]"
            >
              <motion.div
                variants={cardVariants}
                initial="initial"
                whileHover="hover"
                className="group relative bg-white dark:bg-slate-900/50 rounded-[2rem] p-8 border hover:z-20 cursor-pointer h-full min-h-[300px] flex flex-col justify-start transition-colors duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="relative z-10 h-full flex flex-col">
                  <motion.div
                    variants={iconVariants}
                    className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm"
                  >
                    <f.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </motion.div>

                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors duration-300">
                    {f.title}
                  </h3>

                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
                    {f.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                    <span className="text-blue-600 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      Get Started <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Auto-sliding Showcase */}
        <div
          className="relative h-[450px] rounded-[32px] overflow-hidden shadow-2xl bg-slate-950 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence>
            <motion.div
              key={index}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="absolute inset-0"
            >
              <img
                src={showcaseSlides[index].image}
                alt={showcaseSlides[index].title}
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform [transition-duration:3000ms] ease-linear"
              />

              {/* Overlay Gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center p-8 md:p-16">
                <div className="max-w-2xl">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6 border border-blue-500/30"
                  >
                    {showcaseSlides[index].badge}
                  </motion.span>

                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
                  >
                    {showcaseSlides[index].title}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-300 text-lg md:text-xl leading-relaxed mb-10 max-w-xl"
                  >
                    {showcaseSlides[index].description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      size="lg"
                      className="group bg-white text-slate-950 hover:bg-white rounded-full px-10 h-14 font-black text-base shadow-xl hover:shadow-[0_20px_40px_-10px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95 transition-all duration-300"
                    >
                      Learn More
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev - 1 + showcaseSlides.length) % showcaseSlides.length);
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-slate-950/20 hover:bg-slate-950/50 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev + 1) % showcaseSlides.length);
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-slate-950/20 hover:bg-slate-950/50 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-110 active:scale-95 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 right-8 flex gap-3 z-30">
            {showcaseSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${index === i ? "w-8 bg-blue-500" : "w-3 bg-white/20 hover:bg-white/40"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
