import { motion } from "framer-motion";
import { Brain, Bone, Heart, Zap, Baby, Users } from "lucide-react";

const services = [
  {
    icon: Bone,
    title: "Orthopedic Rehab",
    description: "Post-surgery recovery, joint replacements, fractures, and musculoskeletal injuries.",
  },
  {
    icon: Brain,
    title: "Neurological Therapy",
    description: "Stroke recovery, spinal cord injuries, and neurological condition management.",
  },
  {
    icon: Heart,
    title: "Cardiac Rehabilitation",
    description: "Guided recovery programs for heart surgery, cardiac events, and cardiovascular health.",
  },
  {
    icon: Zap,
    title: "Sports Injury Recovery",
    description: "Athlete-focused rehabilitation with performance tracking and return-to-play protocols.",
  },
  {
    icon: Baby,
    title: "Pediatric Physiotherapy",
    description: "Child-friendly therapy programs with gamified exercises and developmental tracking.",
  },
  {
    icon: Users,
    title: "Geriatric Care",
    description: "Fall prevention, mobility enhancement, and age-related condition management.",
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

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Services</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Specialized Care for Every <span className="text-gradient-hero">Need</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From sports injuries to post-surgical recovery, Prism adapts to every patient's unique rehabilitation journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              variants={cardVariants}
              initial="initial"
              whileHover="hover"
              className="group relative bg-white dark:bg-slate-900/50 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 cursor-pointer overflow-hidden transition-colors duration-300"
            >
              {/* Subtle gradient glow overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                <motion.div
                  variants={iconVariants}
                  className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300 shadow-sm"
                >
                  <s.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </motion.div>

                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">
                  {s.title}
                </h3>

                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                  {s.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
