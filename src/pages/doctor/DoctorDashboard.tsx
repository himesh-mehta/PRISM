import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Activity, Calendar, FileText, ChevronRight,
  Search, X, CheckCircle2, Plus, UserX, Loader2, UserCheck, AlertCircle, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // Add Patient Modal state
  const [patientIdInput, setPatientIdInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookedUpPatient, setLookedUpPatient] = useState<any>(null);
  const [lookupError, setLookupError] = useState("");
  const [addingPatient, setAddingPatient] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Patient Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<any>(null);
  const [patientHistory, setPatientHistory] = useState<{ posture: any[], exercise: any[] }>({ posture: [], exercise: [] });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "history">("profile");

  const doctorId = user?.user_id; // Using user_id because doctor_patients table links by user_id

  // Fetch real patients from DB
  const fetchPatients = async () => {
    try {
      if (!doctorId) { setLoadingPatients(false); return; }
      const r = await fetch(apiUrl(`/api/doctor-patients?doctorId=${doctorId}`));
      const d = await r.json();
      if (d.success) setPatients(d.patients || []);
    } catch (e) {
      console.error("Failed to fetch patients:", e);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [user]);

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.condition?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = patients.filter(p => p.status === "Active").length;

  useEffect(() => {
    document.body.style.overflow = (showActiveModal || showAddPatientModal) ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showActiveModal, showAddPatientModal]);

  const closeAddModal = () => {
    setShowAddPatientModal(false);
    setPatientIdInput("");
    setLookedUpPatient(null);
    setLookupError("");
    setAddSuccess(false);
  };

  const handleLookup = async () => {
    const trimmed = patientIdInput.trim();
    if (!trimmed) return;
    setLookupLoading(true);
    setLookedUpPatient(null);
    setLookupError("");
    try {
      const r = await fetch(apiUrl(`/api/lookup-patient?userId=${encodeURIComponent(trimmed)}`));
      const d = await r.json();
      if (d.success && d.patient) {
        setLookedUpPatient(d.patient);
      } else {
        setLookupError(d.error || "No patient found with that ID. Please check and try again.");
      }
    } catch {
      setLookupError("Connection error. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAddPatient = async () => {
    console.log("Adding patient...", { doctorId, patientId: lookedUpPatient?.patient_id });
    
    if (!lookedUpPatient) return;
    
    if (!doctorId) {
      setLookupError("Your doctor session is invalid. Please logout and login again to refresh your credentials.");
      console.error("Missing doctorId in state:", user);
      return;
    }

    setAddingPatient(true);
    try {
      const r = await fetch(apiUrl("/api/add-doctor-patient"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, patientId: lookedUpPatient.user_id }),
      });
      const d = await r.json();
      if (d.success) {
        setAddSuccess(true);
        await fetchPatients(); // Refresh list
        setTimeout(() => closeAddModal(), 1800);
      } else {
        setLookupError(d.error || "Failed to add patient.");
      }
    } catch (e) {
      console.error("Add patient error:", e);
      setLookupError("Connection error. Please try again.");
    } finally {
      setAddingPatient(false);
    }
  };

  const handleViewProfile = async (patient: any) => {
    setSelectedPatientForDetail(patient);
    setShowDetailModal(true);
    setActiveTab("profile");
    setLoadingHistory(true);
    try {
      // Fetch posture history
      const pr = await fetch(apiUrl(`/api/posture-history?patientId=${patient.id}`));
      const pd = await pr.json();
      
      // Fetch exercise history
      const er = await fetch(apiUrl(`/api/exercise-history?userId=${patient.id}`));
      const ed = await er.json();
      
      setPatientHistory({
        posture: pd.success ? pd.sessions : [],
        exercise: ed.success ? ed.metrics : []
      });
    } catch (e) {
      console.error("Failed to fetch history:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in relative">
      {/* Active Patients Modal */}
      <AnimatePresence>
        {showActiveModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowActiveModal(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-[92vh] bg-white dark:bg-[#0a0f1d] z-[201] rounded-[2rem] overflow-hidden shadow-glow border border-white/20 flex flex-col"
            >
              <div className="p-8 border-b border-border/50 flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Active Patients</h2>
                  <p className="text-sm text-muted-foreground font-medium">Currently enrolled in clinical programs</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowActiveModal(false)}
                  className="rounded-full hover:bg-black hover:text-white transition-all duration-300 h-12 w-12">
                  <X className="w-7 h-7" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 premium-scrollbar">
                {patients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <UserX className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">No active patients yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Add patients using their unique Patient ID</p>
                  </div>
                ) : (
                  patients.map((p) => (
                    <motion.div key={p.id} whileHover={{ y: -4, scale: 1.01 }}
                      className="p-5 rounded-2xl bg-secondary/30 border border-border/50 group flex items-center justify-between cursor-pointer hover:shadow-elevated">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-bold text-lg shadow-glow">
                          {p.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{p.name}</h3>
                          <p className="text-xs text-muted-foreground font-medium">{p.gender || "—"} • Added {new Date(p.lastvisit || Date.now()).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Welcome, <span className="text-gradient-hero">Dr. {user?.name?.split(" ")[1] || user?.name || "Doctor"}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Here is your clinical overview for today.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Patients", value: String(activeCount), icon: Users, color: "text-prism-sky", gradient: "from-prism-sky/20 to-transparent", clickable: true },
          { label: "Total Patients", value: String(patients.length), icon: FileText, color: "text-amber-500", gradient: "from-amber-500/20 to-transparent", clickable: false },
          { label: "Appointments Today", value: "—", icon: Calendar, color: "text-prism-glow", gradient: "from-prism-glow/20 to-transparent", clickable: false },
          { label: "Overall Adherence", value: "—", icon: Activity, color: "text-green-500", gradient: "from-green-500/20 to-transparent", clickable: false },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            onClick={() => stat.clickable && setShowActiveModal(true)}
            className={`group bg-glass border-white/20 dark:border-white/5 rounded-3xl p-7 relative overflow-hidden anti-gravity ${stat.clickable ? "cursor-pointer" : ""}`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <div className={`w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-4xl font-display font-extrabold text-foreground">{stat.value}</h3>
            {stat.clickable && (
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-500 backdrop-blur-[2px] pointer-events-none">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  See Details <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Patients List */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="bg-glass border-white/20 dark:border-white/5 rounded-3xl overflow-hidden shadow-elevated anti-gravity"
      >
        <div className="p-8 border-b border-border/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <h2 className="text-2xl font-display font-bold text-foreground">My Patients</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-fit">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                className="pl-11 bg-secondary/50 border border-black focus:border-transparent h-12 rounded-xl focus-visible:ring-primary/30"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setShowAddPatientModal(true)}
              className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 hover:scale-105 transition-all duration-300 h-12 px-6 rounded-xl font-bold flex items-center gap-2 shadow-glow"
            >
              <Plus className="w-5 h-5" /> Add Patient
            </Button>
          </div>
        </div>

        {loadingPatients ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading patients...</span>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserX className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-semibold text-lg">No patients yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              {searchTerm ? "No patients match your search." : "Click \"Add Patient\" and enter a patient's unique ID to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/30 text-muted-foreground text-xs uppercase tracking-[0.2em]">
                  <th className="px-8 py-5 font-bold">Patient Name</th>
                  <th className="px-8 py-5 font-bold">Gender</th>
                  <th className="px-8 py-5 font-bold">Age</th>
                  <th className="px-8 py-5 font-bold">Added On</th>
                  <th className="px-8 py-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-sm">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-secondary/20 transition-all duration-300 group">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white font-bold text-sm shadow-glow group-hover:scale-110 transition-transform duration-300">
                          {patient.name?.charAt(0) || "?"}
                        </div>
                        <span className="font-bold text-foreground text-base">{patient.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-muted-foreground font-medium capitalize">{patient.gender || "—"}</td>
                    <td className="px-8 py-6 text-muted-foreground font-medium">{patient.age ? `${patient.age} yrs` : "—"}</td>
                    <td className="px-8 py-6 text-muted-foreground font-medium">{patient.lastvisit ? new Date(patient.lastvisit).toLocaleDateString() : "—"}</td>
                    <td className="px-8 py-6 text-right">
                      <Button 
                        onClick={() => handleViewProfile(patient)}
                        variant="ghost" 
                        className="h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-semibold"
                      >
                        View Profile <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Patient Modal — ID lookup flow */}
      <AnimatePresence>
        {showAddPatientModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeAddModal}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white dark:bg-[#0a0f1d] z-[201] rounded-[2rem] overflow-hidden shadow-glow border border-white/20 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-7 border-b border-border/50 flex items-center justify-between bg-secondary/10">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Add Patient</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Paste the patient's unique ID to look them up</p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeAddModal} className="rounded-full hover:bg-black/10 hover:text-foreground h-11 w-11">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-7 space-y-6">
                {/* Step 1: ID Input */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Patient Unique ID</label>
                  <div className="flex gap-3">
                    <Input
                      value={patientIdInput}
                      onChange={e => { setPatientIdInput(e.target.value); setLookedUpPatient(null); setLookupError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleLookup()}
                      placeholder="Paste UUID here e.g. 550e8400-e29b-41d4..."
                      className="h-12 rounded-xl bg-secondary/30 border-border/50 font-mono text-sm"
                    />
                    <Button
                      onClick={handleLookup}
                      disabled={!patientIdInput.trim() || lookupLoading}
                      className="h-12 px-5 rounded-xl bg-primary text-white font-bold shrink-0 hover:scale-105 transition-transform shadow-glow disabled:opacity-50 disabled:scale-100"
                    >
                      {lookupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The patient can find their ID in <span className="font-bold text-foreground">Settings → Profile → Your Unique Patient ID</span>
                  </p>
                </div>

                {/* Error State */}
                <AnimatePresence>
                  {lookupError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-medium">{lookupError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Patient Preview Card */}
                <AnimatePresence>
                  {lookedUpPatient && !addSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 space-y-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-display font-bold text-2xl shadow-glow">
                          {lookedUpPatient.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-xl font-display font-bold text-foreground">{lookedUpPatient.name}</p>
                          <p className="text-sm text-muted-foreground">{lookedUpPatient.email}</p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-primary ml-auto shrink-0" />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/30">
                        {[
                          { label: "Age", value: lookedUpPatient.age ? `${lookedUpPatient.age} yrs` : "—" },
                          { label: "Gender", value: lookedUpPatient.gender || "—" },
                          { label: "BMI", value: lookedUpPatient.bmi ? lookedUpPatient.bmi : "—" },
                        ].map(item => (
                          <div key={item.label} className="text-center p-3 rounded-xl bg-secondary/30">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className="text-base font-bold text-foreground mt-1 capitalize">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={handleAddPatient}
                        disabled={addingPatient}
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold text-base shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:scale-100"
                      >
                        {addingPatient ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Adding Patient...</>
                        ) : (
                          <><UserCheck className="w-5 h-5 mr-2" /> Confirm & Add to My Patients</>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Success State */}
                <AnimatePresence>
                  {addSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-6 gap-3 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                        <CheckCircle2 className="w-9 h-9 text-green-500" />
                      </div>
                      <p className="text-xl font-display font-bold text-foreground">Patient Added!</p>
                      <p className="text-sm text-muted-foreground">{lookedUpPatient?.name} is now in your patient list.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedPatientForDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowDetailModal(false); setSelectedPatientForDetail(null); }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-[#0a0f1d] z-[201] shadow-glow border-l border-white/10 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-border/50 flex items-center justify-between bg-secondary/10">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-display font-bold text-3xl shadow-glow">
                    {selectedPatientForDetail.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">{selectedPatientForDetail.name}</h2>
                    <p className="text-muted-foreground font-medium">Patient ID: <span className="font-mono text-xs">{selectedPatientForDetail.id}</span></p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setShowDetailModal(false); setSelectedPatientForDetail(null); }} className="rounded-full h-12 w-12 hover:bg-black/10">
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex px-8 border-b border-border/30 bg-secondary/5">
                {[
                  { id: "profile", label: "Profile Overview", icon: User },
                  { id: "history", label: "Assessment History", icon: Activity }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                      activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 inset-x-0 h-1 bg-primary rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 premium-scrollbar">
                {activeTab === "profile" ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <section className="space-y-4">
                      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Physical Profile</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: "Age", value: selectedPatientForDetail.age ? `${selectedPatientForDetail.age} yrs` : "—" },
                          { label: "Gender", value: selectedPatientForDetail.gender || "—" },
                          { label: "Height", value: selectedPatientForDetail.height ? `${selectedPatientForDetail.height} cm` : "—" },
                          { label: "Weight", value: selectedPatientForDetail.weight ? `${selectedPatientForDetail.weight} kg` : "—" },
                        ].map(item => (
                          <div key={item.label} className="bg-secondary/30 p-4 rounded-2xl border border-border/50">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.label}</p>
                            <p className="text-lg font-bold text-foreground mt-1 capitalize">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-accent-gradient p-0.5 rounded-2xl">
                        <div className="bg-white dark:bg-[#0a0f1d] p-4 rounded-[14px] flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Metabolic Index (BMI)</p>
                            <p className="text-2xl font-display font-black text-foreground mt-1">{selectedPatientForDetail.bmi || "—"}</p>
                          </div>
                          <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono">
                            NORMAL RANGE
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Recent Activity Summary</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 rounded-2xl bg-secondary/20 border border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-prism-sky/10 text-prism-sky flex items-center justify-center">
                              <Activity className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground">Posture Consistency</p>
                              <p className="text-xs text-muted-foreground">Sessions in the last 7 days</p>
                            </div>
                          </div>
                          <p className="text-2xl font-display font-black text-foreground">{patientHistory.posture.length}</p>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {loadingHistory ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Fetching Reports...</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Posture Reports
                          </h3>
                          {patientHistory.posture.length === 0 ? (
                            <div className="p-10 rounded-3xl bg-secondary/20 border border-dashed border-border/50 text-center">
                              <p className="text-sm text-muted-foreground">No posture assessments found for this patient.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {patientHistory.posture.map((session, idx) => (
                                <motion.div
                                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                  key={session.id}
                                  className="p-5 rounded-2xl bg-secondary/30 border border-border/50 flex items-center justify-between hover:border-primary/30 transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-foreground">Initial Assessment</span>
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Completed</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(session.finished_at).toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-tighter">Score</p>
                                    <p className={`text-xl font-display font-black ${session.overall_score > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                      {session.overall_score}%
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 pt-6">
                          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Exercise Metrics
                          </h3>
                          {patientHistory.exercise.length === 0 ? (
                            <div className="p-10 rounded-3xl bg-secondary/20 border border-dashed border-border/50 text-center">
                              <p className="text-sm text-muted-foreground">No exercise logs found for this patient.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {patientHistory.exercise.slice(0, 10).map((metric, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none truncate">{metric.metric_type.replace(/_/g, ' ')}</p>
                                  <div className="flex items-end justify-between mt-2">
                                    <p className="text-xl font-display font-black text-foreground leading-none">{metric.metric_value}</p>
                                    <p className="text-[9px] text-muted-foreground font-medium">{new Date(metric.recorded_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
