import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { exercises, Exercise } from "@/data/exercises";
import { Search, Clock, Target, Dumbbell, ArrowRight, Sun, Moon, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import ExerciseModelViewer from "@/components/ExerciseModelViewer";

const categories = ["All", "Strength", "Shoulder", "Core / Back", "Neck", "Yoga"] as const;

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [selectedCat, setSelectedCat] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const filtered = exercises.filter(ex => {
    const matchCat = selectedCat === "All" || ex.category === selectedCat;
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || 
                      ex.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* 1. Interactive Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4" />
            AI-Trackable Routine
          </div>
          <h1 className="font-display text-4xl font-black text-foreground tracking-tight">
            Exercise Library
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            15 scientifically-backed exercises optimized for MediaPipe Pose AI tracking and physiotherapy.
          </p>
        </motion.div>

        {/* Theme Toggle & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search exercises..." 
              className="pl-10 bg-card/50 backdrop-blur-sm border-border/10 rounded-full h-11"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-11 h-11 bg-card/50 border-border/10 flex-shrink-0"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* 2. Category Filter Chips */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${
              selectedCat === cat
                ? "bg-primary text-primary-foreground border-primary shadow-glow shadow-primary/20 scale-105"
                : "bg-card/40 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Premium Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((ex, i) => (
            <motion.div
              layout
              key={ex.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500"
            >
              {/* Image Container */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={ex.image}
                  alt={ex.name}
                  style={{ objectPosition: ex.objectPosition || "center 20%" }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md px-3 font-bold">
                    {ex.category}
                  </Badge>
                </div>
                
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className={`font-bold px-3 py-1 backdrop-blur-md ${
                    ex.difficulty === "Beginner" 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}>
                    {ex.difficulty}
                  </Badge>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h3 className="font-display text-2xl font-black text-foreground mb-2 group-hover:text-primary transition-colors">
                  {ex.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                  {ex.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {ex.targetMuscles.map(m => (
                    <span key={m} className="px-2 py-0.5 rounded-lg bg-secondary/80 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {m}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/30 border border-border/10">
                    <Target className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold leading-none">Sets</p>
                      <p className="text-sm font-black text-foreground">{ex.sets} × {ex.reps}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/30 border border-border/10">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-bold leading-none">Time</p>
                      <p className="text-sm font-black text-foreground">{ex.duration}</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedExercise(ex)}
                  className="w-full h-12 rounded-2xl font-black bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-300"
                >
                  View Details <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Dumbbell className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground">No matches found</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">Try refining your search or filter.</p>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[2.5rem] bg-card border-border/20 shadow-2xl">
          {selectedExercise && (
            <div className="flex flex-col h-full max-h-[90vh]">
              {/* Animation Header */}
              <div className="h-64 sm:h-80 w-full relative bg-slate-950">
                <ExerciseModelViewer models={[selectedExercise.id.includes("push") ? "/meshcharacters/pushup.glb" : "/meshcharacters/idle.glb"]} />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
                <Badge className="absolute top-6 left-6 bg-primary font-black px-4 py-1.5 shadow-lg">
                  {selectedExercise.category} Preview
                </Badge>
              </div>

              <div className="p-8 sm:p-10 -mt-12 relative z-10 bg-card rounded-t-[2.5rem]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-display text-4xl font-black text-foreground tracking-tight">
                      {selectedExercise.name}
                    </h2>
                    <p className="text-primary font-bold mt-1 uppercase text-sm tracking-widest flex items-center gap-2">
                       {selectedExercise.difficulty} Intensity
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => navigate(`/dashboard/tracker?start=true&exercise=${encodeURIComponent(selectedExercise.id)}`)} 
                    className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-8 shadow-xl shadow-primary/20"
                  >
                    Start AI Training <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 overflow-y-auto pr-2">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                        <Dumbbell className="w-4 h-4" /> About Exercise
                      </h4>
                      <p className="text-foreground leading-relaxed">
                        {selectedExercise.description}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Target Areas</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedExercise.targetMuscles.map(m => (
                          <Badge key={m} variant="secondary" className="px-4 py-1.5 rounded-xl font-bold bg-secondary/50">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/20 rounded-3xl p-6 border border-border/10">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Training Protocol</h4>
                    <div className="space-y-4">
                      {selectedExercise.steps.map((step, j) => (
                        <div key={j} className="flex gap-4">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black border border-primary/20">
                            {j + 1}
                          </span>
                          <p className="text-sm text-foreground/80 leading-snug">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseLibrary;
