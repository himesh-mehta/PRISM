import { motion } from "framer-motion";
import aboutImg from "@/assets/about-clinic.jpg";
import { CheckCircle2, Star } from "lucide-react";

const highlights = [
  "Founded by physiotherapists and AI engineers",
  "Trusted by 200+ clinics worldwide",
  "FDA-compliant data security standards",
  "Evidence-based exercise protocols",
];

const highlightVariants: any = {
  initial: {
    y: 0,
    scale: 1,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    borderColor: "transparent",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    backgroundColor: "hsl(var(--secondary))",
    boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.2)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const AboutSection = () => {
  return (
    <section id="about" className="py-32 bg-secondary/20 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-prism-sky/5 blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white dark:border-white/5">
              <img src={aboutImg} alt="Modern physiotherapy clinic" className="w-full h-[500px] object-cover" />
            </div>
            {/* Floating premium stat card */}
            <div className="absolute -bottom-8 -right-8 bg-white/90 dark:bg-prism-navy/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-elevated border border-white/20 group hover:-translate-y-2 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center shadow-glow">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <p className="font-display text-4xl font-bold text-primary">12+</p>
              </div>
              <p className="text-muted-foreground font-semibold text-sm uppercase tracking-wider">Years of Excellence</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest mb-4">
              Our Legacy
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 mb-8 leading-tight">
              Bridging Technology & <br />
              <span className="text-gradient-hero">Rehabilitation</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Prism was born from a simple belief: recovery should be intelligent, accessible, and personalized. Our platform merges cutting-edge AI with decades of physiotherapy expertise to create a seamless rehabilitation experience.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              We work alongside leading physiotherapists, orthopedic surgeons, and AI researchers to ensure every exercise, recommendation, and insight is grounded in clinical evidence.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {highlights.map((h) => (
                <motion.div
                  key={h}
                  variants={highlightVariants}
                  initial="initial"
                  whileHover="hover"
                  className="group relative flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-default overflow-hidden transition-colors duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative z-10 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-prism-sky/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                      <CheckCircle2 className="w-4 h-4 text-prism-sky group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-foreground text-sm font-bold tracking-tight group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors">{h}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};


export default AboutSection;
