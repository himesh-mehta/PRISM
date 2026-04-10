import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, ArrowRight, X, Activity, User, Save, BellRing, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

// Exercise library (static - these are the available physiotherapy exercises)
const exerciseLibrary = [
  { id: "1", title: "Wall Angels", category: "Posture", difficulty: "Beginner", target: "Upper Back", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000&auto=format&fit=crop" },
  { id: "2", title: "Chin Tucks", category: "Neck", difficulty: "Beginner", target: "Cervical Spine", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2000&auto=format&fit=crop" },
  { id: "3", title: "Supine Bridge", category: "Core", difficulty: "Intermediate", target: "Lower Back/Glutes", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2000&auto=format&fit=crop" },
  { id: "4", title: "Knee Extensions", category: "Lower Body", difficulty: "Beginner", target: "Quads", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop" },
  { id: "5", title: "Shoulder Rotations", category: "Upper Body", difficulty: "Beginner", target: "Rotator Cuff", image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2000&auto=format&fit=crop" },
  { id: "6", title: "Plank Variations", category: "Core", difficulty: "Advanced", target: "Core/Shoulders", image: "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?q=80&w=2000&auto=format&fit=crop" },
];

const PrescriptionBuilder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [prescriptionStack, setPrescriptionStack] = useState<any[]>([]);
  const [realPatients, setRealPatients] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch real patients from DB
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const doctorId = user?.user_id; // Using user_id for doctor_patients mapping
        if (!doctorId) return;
        const r = await fetch(`/api/doctor-patients?doctorId=${doctorId}`);
        const d = await r.json();
        if (d.success) setRealPatients((d.patients || []).map((p: any) => p.name).filter(Boolean));
      } catch (e) { /* silently fail */ }
    };
    fetchPatients();
  }, [user]);

  const filteredExercises = exerciseLibrary.filter(ex =>
    ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToStack = (exercise: any) => {
    if (prescriptionStack.some(e => e.id === exercise.id)) {
      toast({ title: "Already added", description: "This exercise is already in the stack.", variant: "destructive" });
      return;
    }
    setPrescriptionStack([...prescriptionStack, { ...exercise, sets: 3, reps: 10, repsPerSide: false, duration: 0 }]);
    toast({ title: "Added to Stack", description: `${exercise.title} has been added.` });
  };

  const removeFromStack = (id: string) => {
    setPrescriptionStack(prescriptionStack.filter(e => e.id !== id));
  };

  const updateParam = (id: string, field: string, value: string | boolean) => {
    setPrescriptionStack(prev => prev.map(ex => {
      if (ex.id === id) {
        return { ...ex, [field]: value };
      }
      return ex;
    }));
  };

  const handleSendPrescription = () => {
    if (!selectedPatient) {
      toast({ title: "Error", description: "Please select a patient to send the prescription to.", variant: "destructive" });
      return;
    }

    // In a real app, this would hit an API endpoint
    toast({
      title: "Prescription Sent!",
      description: `Successfully assigned ${prescriptionStack.length} exercises to ${selectedPatient}.`
    });
    setPrescriptionStack([]);
    setSelectedPatient("");
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1440px] mx-auto h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            <span className="text-gradient-hero">Prescription Builder</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Design and assign personalized rehab programs.</p>
        </div>

        {/* Patient Selection trigger */}
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 h-12 px-6 rounded-xl font-semibold backdrop-blur-sm">
                <User className="w-5 h-5 mr-2" />
                {selectedPatient || "Select Patient"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-glass border-white/20 dark:border-white/5 backdrop-blur-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-display font-bold">Assign to Patient</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input placeholder="Search patients..." className="pl-12 bg-secondary/50 border-none h-12 rounded-xl focus-visible:ring-primary/30" />
                </div>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {realPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <UserX className="w-10 h-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">No patients assigned yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Add patients from the dashboard first</p>
                    </div>
                  ) : (
                    realPatients.map((patient) => (
                      <button
                        key={patient}
                        onClick={() => setSelectedPatient(patient)}
                        className={`w-full text-left px-5 py-4 rounded-2xl transition-all border-2 ${selectedPatient === patient
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-transparent hover:bg-secondary/50 text-muted-foreground'
                          }`}
                      >
                        <div className="font-bold text-base">{patient}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setSelectedPatient("")} variant="ghost" className="rounded-xl">Clear Selection</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleSendPrescription}
            disabled={prescriptionStack.length === 0 || !selectedPatient}
            className="bg-accent-gradient text-accent-foreground shadow-glow hover:scale-105 transition-all duration-300 h-12 px-8 rounded-xl font-bold disabled:opacity-50 disabled:scale-100"
          >
            <BellRing className="w-5 h-5 mr-2" /> Send Prescription
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-6">

        {/* Exercise Library Column */}
        <div className="lg:col-span-7 bg-glass border-white/20 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-elevated transition-colors">
          <div className="p-6 border-b border-border/30 backdrop-blur-md z-10 space-y-4">
            <h2 className="text-xl font-display font-bold text-foreground">Exercise Library</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search exercise library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 bg-secondary/50 border-none h-12 rounded-xl focus-visible:ring-primary/30"
                />
              </div>
              <Button variant="outline" className="h-12 px-5 rounded-xl border-border/50 bg-secondary/30 backdrop-blur-sm shrink-0 font-semibold hover:bg-secondary/50">
                <Filter className="w-4 h-4 mr-2" /> Filters
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredExercises.map((exercise) => (
                <motion.div
                  key={exercise.id}
                  whileHover={{ y: -4 }}
                  className="group relative bg-secondary/30 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-primary/40 transition-all flex gap-5"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-muted shadow-sm">
                    <img src={exercise.image} alt={exercise.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                    <div>
                      <h3 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">{exercise.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] uppercase font-bold text-primary tracking-wider">{exercise.category}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[11px] font-semibold text-muted-foreground">{exercise.difficulty}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => addToStack(exercise)}
                      size="sm"
                      className="w-full h-9 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all duration-300 font-bold border border-primary/20"
                    >
                      <Plus className="w-4 h-4 mr-1.5" /> Add to Stack
                    </Button>
                  </div>
                </motion.div>
              ))}

              {filteredExercises.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium text-lg">No exercises found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prescription Stack Column */}
        <div className="lg:col-span-5 bg-glass border-white/20 dark:border-white/5 rounded-3xl flex flex-col overflow-hidden shadow-elevated relative">
          <div className="p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
            <h2 className="font-display font-bold text-xl text-foreground flex items-center gap-3">
              <Activity className="w-6 h-6 text-primary" />
              Current Stack
              <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
                {prescriptionStack.length} ITEMS
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            <AnimatePresence mode="popLayout">
              {prescriptionStack.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6"
                >
                  <div className="w-20 h-20 rounded-3xl bg-secondary/50 flex items-center justify-center shadow-inner">
                    <Plus className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold text-lg mb-2">Your stack is empty</p>
                    <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed font-medium">Add exercises from the library to build your personalized rehab protocol.</p>
                  </div>
                </motion.div>
              ) : (
                prescriptionStack.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.95 }}
                    className="bg-secondary/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 relative group hover:bg-secondary/60 transition-colors"
                  >
                    <button
                      onClick={() => removeFromStack(item.id)}
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg hover:scale-110 z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="text-xs font-extrabold text-primary">{idx + 1}</span>
                      </div>
                      <h4 className="font-bold text-foreground text-sm flex-1 truncate">{item.title}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-muted-foreground tracking-[0.1em] font-bold">Standard Sets</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.sets}
                          onChange={(e) => updateParam(item.id, 'sets', e.target.value)}
                          className="h-10 text-sm bg-background/50 border-white/10 rounded-xl font-bold focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-muted-foreground tracking-[0.1em] font-bold">Reps / Time</label>
                        <Input
                          type="text"
                          value={item.reps}
                          onChange={(e) => updateParam(item.id, 'reps', e.target.value)}
                          className="h-10 text-sm bg-background/50 border-white/10 rounded-xl font-bold focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {prescriptionStack.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-6 border-t border-border/30 bg-secondary/20"
              >
                <div className="flex justify-between items-center text-sm font-bold px-2">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Volume</span>
                    <span className="text-foreground text-lg">{prescriptionStack.length} Exercises</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Est. Completion</span>
                    <span className="text-primary text-lg">~{prescriptionStack.length * 5} Mins</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionBuilder;
