import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star, ShieldCheck, Zap } from "lucide-react";
import heroVideo from "@/assets/AI_Physiotherapy_Landing_Page_Video.mp4";

interface HeroSectionProps {
  onLoginClick?: () => void;
  onJoinClick?: () => void;
}

const HeroSection = ({ onLoginClick, onJoinClick }: HeroSectionProps) => {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Note: Ideally use a high-quality Indian wellness video here */}
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Improved Overlay: Darker with a hint of warm glow to blend better */}
        <div className="absolute inset-0 bg-gradient-to-r from-prism-navy/95 via-prism-navy/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-prism-navy/20 z-10" />

        {/* Decorative orbs */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-prism-sky/20 blur-[120px] animate-float z-0" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-prism-glow/15 blur-[100px] animate-float z-0" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-20 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-3xl lg:pl-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-8 tracking-tight"
            >
              Recover smarter, <br />
              <span className="text-gradient-hero">not harder.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-white/70 max-w-xl mb-12 leading-relaxed"
            >
              Prism combines AI posture detection, 3D exercise visualization, and smart tracking to deliver a personalized physiotherapy experience — anytime, anywhere.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-5"
            >
              <Button
                onClick={onJoinClick}
                size="lg"
                className="group bg-accent-gradient text-white shadow-glow hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300 text-lg px-10 h-14 rounded-2xl"
              >
                Get Started <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/5 hover:bg-white/10 text-white backdrop-blur-xl border-white/10 hover:border-white/30 text-lg px-10 h-14 rounded-2xl transition-all duration-300 group">
                <Play className="mr-2 w-5 h-5 fill-white group-hover:scale-110 transition-transform" /> Watch Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="flex flex-wrap gap-8 md:gap-14 mt-16 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md w-fit"
            >
              {[
                { value: "10K+", label: "Active Users", icon: Star },
                { value: "98%", label: "Recovery Rate", icon: Zap },
                { value: "500+", label: "Exercises", icon: ShieldCheck },
              ].map((stat) => (
                <div key={stat.label} className="group cursor-default">
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-3.5 h-3.5 text-prism-sky group-hover:scale-110 transition-transform" />
                    <p className="font-display text-3xl font-bold font-display text-white">{stat.value}</p>
                  </div>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Floating Cards Section */}
          <div className="hidden lg:flex relative h-[600px] items-center justify-center">
            {/* Main Center Illustration Placeholder / Asset */}
            <div className="relative z-10 w-full aspect-square rounded-full bg-gradient-to-br from-prism-sky/20 to-prism-indigo/20 blur-2xl animate-pulse" />

          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

