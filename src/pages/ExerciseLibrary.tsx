import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { exercises, bodyParts, bodyPartIcons, Exercise } from "@/data/exercises";
import { Search, ChevronDown, ChevronUp, Clock, Dumbbell, Target, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ExerciseModelViewer from "@/components/ExerciseModelViewer";

const difficultyColor = {
  Beginner: "bg-green-100 text-green-700 border-green-200",
  Intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  Advanced: "bg-red-100 text-red-700 border-red-200",
};

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const [selectedPart, setSelectedPart] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);


  const filtered = exercises.filter(ex => {
    const matchPart = selectedPart === "All" || ex.bodyPart === selectedPart;
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || ex.bodyPart.toLowerCase().includes(search.toLowerCase());
    return matchPart && matchSearch;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Exercise Library</h1>
        <p className="text-muted-foreground mt-1">{exercises.length} exercises organized by body part</p>
      </motion.div>

      {/* Body Part Hero Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {bodyParts.slice(0, 6).map((part, i) => {
          const count = exercises.filter(e => e.bodyPart === part).length;
          const isSelected = selectedPart === part;
          return (
            <motion.button
              key={part}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedPart(isSelected ? "All" : part)}
              className={`relative rounded-2xl p-4 border transition-all duration-300 text-left overflow-hidden group ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-card border-border hover:border-primary/30 hover:shadow-card"
              }`}
            >
              <span className="text-2xl mb-2 block">{bodyPartIcons[part]}</span>
              <p className={`font-display font-semibold text-sm ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>{part}</p>
              <p className={`text-xs mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{count} exercises</p>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exercises..." className="pl-10" />
          </div>
          <div className="flex bg-secondary rounded-lg p-1">
            <button onClick={() => setViewMode("grid")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <Layers className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <Target className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedPart("All")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedPart === "All" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
            All ({exercises.length})
          </button>
          {bodyParts.map(part => {
            const count = exercises.filter(e => e.bodyPart === part).length;
            return (
              <button key={part} onClick={() => setSelectedPart(part)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedPart === part ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>
                {bodyPartIcons[part]} {part} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ex, i) => (
            <motion.div
              key={ex.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image */}
              <div 
                className="relative h-44 overflow-hidden cursor-pointer" 
                onClick={() => setSelectedExercise(ex)}
              >
                <img
                  src={ex.image}
                  alt={ex.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <Badge variant="outline" className={`absolute top-3 right-3 ${difficultyColor[ex.difficulty]} backdrop-blur-sm`}>
                  {ex.difficulty}
                </Badge>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display font-bold text-white text-base">{ex.name}</h3>
                  <p className="text-white/70 text-xs mt-0.5">{ex.bodyPart}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{ex.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ex.duration || "5 min"}</span>
                  <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {ex.equipment || "None"}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{ex.reps}</span> reps × <span className="font-medium text-foreground">{ex.sets}</span> sets
                  </div>
                  <button
                    onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    {expandedId === ex.id ? "Hide steps" : "View steps"}
                  </button>
                </div>

                {/* Target Muscles */}
                {ex.targetMuscles && (
                  <div className="flex flex-wrap gap-1">
                    {ex.targetMuscles.map(m => (
                      <span key={m} className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground">{m}</span>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {expandedId === ex.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="pt-3 border-t border-border">
                        <h4 className="text-xs font-semibold text-foreground mb-2">Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
                          {ex.steps.map((step, j) => <li key={j}>{step}</li>)}
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filtered.map((ex, i) => (
            <motion.div key={ex.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <button onClick={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/30 transition-colors">
                <img src={ex.image} alt={ex.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" loading="lazy" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{ex.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{ex.bodyPart} • {ex.reps} reps × {ex.sets} sets • {ex.duration}</p>
                  {ex.targetMuscles && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ex.targetMuscles.slice(0, 3).map(m => (
                        <span key={m} className="px-1.5 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="outline" className={difficultyColor[ex.difficulty]}>{ex.difficulty}</Badge>
                  {expandedId === ex.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              <AnimatePresence>
                {expandedId === ex.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-0 border-t border-border">
                      <p className="text-muted-foreground text-sm mt-3 mb-3">{ex.description}</p>
                      <div className="flex gap-4 mb-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ex.duration}</span>
                        <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> {ex.equipment}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        {ex.steps.map((step, j) => <li key={j}>{step}</li>)}
                      </ol>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No exercises found matching your search.</div>
      )}

      {/* Details Display Dialog */}
      <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent className="sm:max-w-lg h-auto rounded-2xl bg-card/95 backdrop-blur-md border-border/40 shadow-elevated">
          {selectedExercise && (
            <div className="space-y-4 flex flex-col pt-4">
              {/* 3D Model Viewer frame */}
              <div className="h-56 w-full relative rounded-xl overflow-hidden border border-border/10 bg-slate-950">
                <ExerciseModelViewer models={[selectedExercise.name.toLowerCase().includes("push") ? "/meshcharacters/pushup.glb" : "/meshcharacters/idle.glb"]} />
              </div>

              <div>
                <h3 className="font-display font-bold text-xl text-black dark:text-white flex items-center justify-between">
                  {selectedExercise.name}
                  <Badge className={difficultyColor[selectedExercise.difficulty]}>{selectedExercise.difficulty}</Badge>
                </h3>
                <p className="text-xs text-black/80 dark:text-white/80 font-medium">{selectedExercise.bodyPart}</p>
              </div>
              <p className="text-sm text-black dark:text-slate-100 font-medium">{selectedExercise.description}</p>
              <div className="flex gap-4 text-xs text-black/80 dark:text-white/80 font-semibold">
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedExercise.duration || "5 min"}</span>
                <span className="flex items-center gap-1"><Dumbbell className="w-4 h-4" /> {selectedExercise.equipment || "None"}</span>
              </div>
              <div className="border-t border-border pt-3 mt-auto">
                <h4 className="text-sm font-bold text-black dark:text-white mb-1.5 font-display">Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs text-black dark:text-slate-100 font-medium">
                  {selectedExercise.steps.map((step, j) => <li key={j}>{step}</li>)}
                </ol>
              </div>

              <Button 
                onClick={() => navigate(`/dashboard/tracker?start=true&exercise=${encodeURIComponent(selectedExercise.id)}`)} 
                className="w-full bg-accent-gradient text-white font-bold rounded-xl mt-2 tracking-wide"
              >
                Start Tracking <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseLibrary;
