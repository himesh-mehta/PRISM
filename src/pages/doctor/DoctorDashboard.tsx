import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Activity, Calendar, FileText, ChevronRight,
  Search, X, CheckCircle2, TrendingUp, AlertCircle, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

// Mock data for modal (10 patients)
const activePatients = [
  { id: 1, name: "Sarah Jenkins", condition: "Post-ACL Surgery", lastVisit: "2 hours ago", status: "Active" },
  { id: 2, name: "Marcus Reed", condition: "Lumbar Herniation", lastVisit: "Yesterday", status: "Active" },
  { id: 3, name: "Emily Chen", condition: "Rotator Cuff Tendinitis", lastVisit: "5 hours ago", status: "Active" },
  { id: 4, name: "David Thompson", condition: "Knee Replacement", lastVisit: "3 days ago", status: "Inactive" },
  { id: 5, name: "James Wilson", condition: "Shoulder Impingement", lastVisit: "1 day ago", status: "Active" },
  { id: 6, name: "Robert Taylor", condition: "Ankle Sprain", lastVisit: "4 hours ago", status: "Active" },
  { id: 7, name: "Linda Moore", condition: "Hip Bursitis", lastVisit: "2 days ago", status: "Inactive" },
  { id: 8, name: "Michael Brown", condition: "Tennis Elbow", lastVisit: "6 hours ago", status: "Active" },
  { id: 9, name: "Patricia Davis", condition: "Carpal Tunnel", lastVisit: "Yesterday", status: "Active" },
  { id: 10, name: "William Miller", condition: "Neck Strain", lastVisit: "1 week ago", status: "Inactive" },
];

// Mock data for main table (15 patients)
const allPatients = [
  ...activePatients,
  { id: 11, name: "Jennifer Garcia", condition: "Plantar Fasciitis", lastVisit: "2 days ago", status: "Active" },
  { id: 12, name: "Christopher Martinez", condition: "Meniscus Tear", lastVisit: "3 days ago", status: "Inactive" },
  { id: 13, name: "Elizabeth Robinson", condition: "Sciatica", lastVisit: "Yesterday", status: "Active" },
  { id: 14, name: "Daniel Clark", condition: "Wrist Fracture", lastVisit: "1 week ago", status: "Inactive" },
  { id: 15, name: "Matthew Rodriguez", condition: "Bicep Tendonitis", lastVisit: "4 days ago", status: "Active" },
];

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPatients = allPatients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.condition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (showActiveModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showActiveModal]);

  return (
    <div className="space-y-10 animate-fade-in relative">
      <AnimatePresence>
        {showActiveModal && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActiveModal(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4"
            />

            {/* Modal Content */}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowActiveModal(false)}
                  className="rounded-full hover:bg-black hover:text-white transition-all duration-300 h-12 w-12"
                >
                  <X className="w-7 h-7" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 premium-scrollbar">
                {activePatients.map((p) => (
                  <motion.div
                    key={p.id}
                    onClick={() => {
                      setShowActiveModal(false);
                      setTimeout(() => navigate(`/doctor/patient/${p.id}`), 300);
                    }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="p-5 rounded-2xl bg-secondary/30 border border-border/50 group flex items-center justify-between cursor-pointer transition-colors hover:bg-white dark:hover:bg-white/5 hover:shadow-elevated"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent-gradient flex items-center justify-center text-white font-bold text-lg shadow-glow">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-lg">{p.name}</h3>
                        <p className="text-xs text-muted-foreground font-medium">{p.condition} • {p.lastVisit}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${p.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                          }`}>
                          {p.status}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
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
          { label: "Active Patients", value: "24", icon: Users, color: "text-prism-sky", gradient: "from-prism-sky/20 to-transparent" },
          { label: "Pending Reviews", value: "7", icon: FileText, color: "text-amber-500", gradient: "from-amber-500/20 to-transparent" },
          { label: "Appointments Today", value: "5", icon: Calendar, color: "text-prism-glow", gradient: "from-prism-glow/20 to-transparent" },
          { label: "Overall Adherence", value: "78%", icon: Activity, color: "text-green-500", gradient: "from-green-500/20 to-transparent" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            onClick={() => stat.label === "Active Patients" && setShowActiveModal(true)}
            className={`group bg-glass border-white/20 dark:border-white/5 rounded-3xl p-7 relative overflow-hidden anti-gravity ${stat.label === "Active Patients" ? "cursor-pointer" : ""}`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              <div className={`w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-display font-extrabold text-foreground">{stat.value}</h3>
              <span className="text-xs font-medium text-success flex items-center gap-0.5">
                +12% <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
              </span>
            </div>

            {/* See Details Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-500 backdrop-blur-[2px] pointer-events-none">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                See Details <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Patients List */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 text-muted-foreground text-xs uppercase tracking-[0.2em]">
                <th className="px-8 py-5 font-bold">Patient Name</th>
                <th className="px-8 py-5 font-bold">Condition</th>
                <th className="px-8 py-5 font-bold">Last Visit</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-secondary/20 transition-all duration-300 group">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center text-white font-bold text-sm shadow-glow group-hover:scale-110 transition-transform duration-300">
                        {patient.name.charAt(0)}
                      </div>
                      <span className="font-bold text-foreground text-base">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-muted-foreground font-medium">{patient.condition}</td>
                  <td className="px-8 py-6 text-muted-foreground font-medium">{patient.lastVisit}</td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${patient.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                      }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" className="h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-semibold">
                      View Profile <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddPatientModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddPatientModal(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white dark:bg-[#0a0f1d] z-[201] rounded-[2rem] overflow-hidden shadow-glow border border-white/20 flex flex-col"
            >
              <div className="p-8 border-b border-border/50 flex items-center justify-between bg-secondary/10">
                <h2 className="text-2xl font-display font-bold text-foreground">Add New Patient</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowAddPatientModal(false)} className="rounded-full hover:bg-black hover:text-white">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Patient Name</label>
                  <Input placeholder="Enter full name" className="h-12 rounded-xl bg-secondary/30 border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Condition</label>
                  <Input placeholder="Primary diagnosis" className="h-12 rounded-xl bg-secondary/30 border-none" />
                </div>
                <Button className="w-full h-12 rounded-xl bg-primary text-white font-bold text-lg mt-4 shadow-glow hover:scale-[1.02] transition-transform">
                  Register Patient
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
