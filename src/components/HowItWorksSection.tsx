import { motion } from "framer-motion";
import { Upload, Cpu, TrendingUp, FileText } from "lucide-react";
import humanAiBg from "@/assets/human-ai-bg.png";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Input Data",
    description: "Patients upload medical records, injury details, and initial assessment data into the platform.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Processing",
    description: "Our AI engine analyzes posture, movement patterns, and medical history to create a personalized treatment plan.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Track & Adapt",
    description: "Real-time monitoring tracks exercise compliance, range of motion, and pain levels. Plans adapt automatically.",
  },
  {
    icon: FileText,
    step: "04",
    title: "Reports & Insights",
    description: "Generate comprehensive progress reports for patients, therapists, and insurance providers.",
  },
];

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

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-hero-gradient relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-15 mix-blend-luminosity"
        style={{ backgroundImage: `url(${humanAiBg})` }}
      />
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-prism-navy/50 to-prism-navy" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-prism-sky/20 blur-3xl mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/3 w-60 h-60 rounded-full bg-prism-glow/20 blur-3xl mix-blend-screen" />
        {/* Tint overlay matching theme */}
        <div className="absolute inset-0 bg-prism-navy/40" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            className="inline-block text-white font-semibold text-sm uppercase tracking-wider bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/20 cursor-default transition-all"
          >
            How It Works
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4">
            The Data Layer Behind Your Recovery
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            A seamless pipeline from data input to actionable insights — here's how Prism transforms raw data into personalized care.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              variants={cardVariants}
              initial="initial"
              whileHover="hover"
              className="group relative bg-secondary/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 dark:border-white/5 cursor-pointer overflow-hidden transition-colors duration-300"
            >
              {/* Subtle gradient glow overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <motion.div
                    variants={iconVariants}
                    className="w-12 h-12 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300"
                  >
                    <s.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </motion.div>
                  <span className="font-display text-4xl font-black text-blue-900/30 dark:text-blue-500/20 group-hover:text-blue-600/30 transition-colors">{s.step}</span>
                </div>

                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                  {s.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {s.description}
                </p>
              </div>

              {/* Connector line - Desktop only */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-blue-600/20" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
