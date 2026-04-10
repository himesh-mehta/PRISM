import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, ScanEye, Library, BarChart3, TrendingUp, Clock, Target, Heart, Brain,
  AlertTriangle, CheckCircle2, ArrowUpRight, Zap, CalendarDays, User2, MessageCircle,
  Play, FileText, Smartphone, Plus, Award, Info, Bot, ChevronLeft, ChevronRight,
  MoreVertical, Check, Video, History, MousePointer2, Sparkles, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SparklineChart from "@/components/SparklineChart";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell,
  Bar, BarChart, ComposedChart, Cell as RechartsCell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

const emptyWeeklyData = [
  { day: "Mon", reps: 0, calories: 0 },
  { day: "Tue", reps: 0, calories: 0 },
  { day: "Wed", reps: 0, calories: 0 },
  { day: "Thu", reps: 0, calories: 0 },
  { day: "Fri", reps: 0, calories: 0 },
  { day: "Sat", reps: 0, calories: 0 },
  { day: "Sun", reps: 0, calories: 0 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item: any = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    } 
  }
};

const Dashboard = () => {
  const [painLevel, setPainLevel] = useState([0]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [realStats, setRealStats] = useState({
    totalSessions: 0,
    avgPostureScore: 0,
    totalReps: 0,
    totalExerciseSessions: 0,
    latestScore: 0,
  });

  useEffect(() => {
    const fetchDbActivity = async () => {
      if (!user?.user_id) return;
      try {
        setLoadingLogs(true);
        const logs: any[] = [];

        // 1. Posture Logs
        if (user.patient_id) {
          const pRes = await fetch(`/api/posture-history?patientId=${user.patient_id}`);
          const pData = await pRes.json();
          if (pData.success) {
            pData.sessions.slice(0, 5).forEach((s: any) => {
              logs.push({
                type: 'posture',
                title: 'Posture Analysis',
                time: new Date(s.finished_at).toLocaleString(),
                result: `${s.overall_score}% Score`,
                rawDate: new Date(s.finished_at)
              });
            });
          }
        }

        // 2. Exercise Logs (Metric updates)
        const eRes = await fetch(`/api/exercise-history?userId=${user.user_id}`);
        const eData = await eRes.json();
        if (eData.success) {
          // Group by timestamp to show sessions
          const seenTime = new Set();
          eData.metrics.forEach((m: any) => {
             const timeStr = new Date(m.recorded_at).toISOString();
             if (!seenTime.has(timeStr)) {
               seenTime.add(timeStr);
               logs.push({
                 type: 'exercise',
                 title: m.metric_type.split('_').pop()?.toUpperCase() + " Workout",
                 time: new Date(m.recorded_at).toLocaleString(),
                 result: 'Logged',
                 rawDate: new Date(m.recorded_at)
               });
             }
          });
        }

        // Sort by date desc
        logs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
        setDbLogs(logs.slice(0, 8));

        // Compute real stats
        const postureLogs = logs.filter(l => l.type === 'posture');
        const exerciseLogs = logs.filter(l => l.type === 'exercise');
        const scores = postureLogs.map(l => parseInt(l.result) || 0);
        setRealStats({
          totalSessions: logs.length,
          avgPostureScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
          totalReps: exerciseLogs.length,
          totalExerciseSessions: exerciseLogs.length,
          latestScore: scores.length > 0 ? scores[0] : 0,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchDbActivity();
  }, [user]);

  const dailyData = [
    { day: "08:00", posture: 0, pain: 0 },
    { day: "10:00", posture: 0, pain: 0 },
    { day: "12:00", posture: 0, pain: 0 },
    { day: "14:00", posture: 0, pain: 0 },
    { day: "16:00", posture: 0, pain: 0 },
    { day: "18:00", posture: 0, pain: 0 },
    { day: "20:00", posture: 0, pain: 0 },
  ];

  const monthlyData = [
    { day: "Week 1", posture: 0, pain: 0 },
    { day: "Week 2", posture: 0, pain: 0 },
    { day: "Week 3", posture: 0, pain: 0 },
    { day: "Week 4", posture: 0, pain: 0 },
  ];

  const chartDataMap = {
    daily: dailyData,
    weekly: emptyWeeklyData,
    monthly: monthlyData
  };

  const mockLogs: any[] = []; // empty — all data comes from DB now

  const metrics = [
    { label: "Pain Level", value: `${painLevel[0]}/10`, trend: painLevel[0] <= 3 ? "-" : "", icon: Heart, sparkline: [0, 0, 0, 0, 0, 0, painLevel[0]], color: "text-rose-500", trendType: "positive", insight: painLevel[0] === 0 ? "No data yet" : "Self-reported" },
    { label: "Posture Score", value: realStats.avgPostureScore > 0 ? `${realStats.avgPostureScore}%` : "—", trend: realStats.avgPostureScore > 0 ? `${realStats.latestScore}%` : "—", icon: ScanEye, sparkline: [0, 0, 0, 0, 0, 0, realStats.avgPostureScore], color: "text-blue-500", trendType: "positive", insight: realStats.avgPostureScore > 0 ? "Based on your scans" : "Run a posture scan" },
    { label: "Total Sessions", value: `${realStats.totalSessions}`, trend: realStats.totalSessions > 0 ? `${realStats.totalSessions}` : "0", icon: Target, sparkline: [0, 0, 0, 0, 0, 0, realStats.totalSessions], color: "text-indigo-500", trendType: "positive", insight: realStats.totalSessions > 0 ? "Keep it up!" : "Start your first session" },
    { label: "Exercises Done", value: `${realStats.totalExerciseSessions}`, trend: realStats.totalExerciseSessions > 0 ? `+${realStats.totalExerciseSessions}` : "0", icon: Zap, sparkline: [0, 0, 0, 0, 0, 0, realStats.totalExerciseSessions], color: "text-amber-500", trendType: "positive", insight: realStats.totalExerciseSessions > 0 ? "Great consistency!" : "Try the exercise tracker" },
    { label: "Latest Score", value: realStats.latestScore > 0 ? `${realStats.latestScore}%` : "—", trend: realStats.latestScore > 0 ? "Latest" : "—", icon: Clock, sparkline: [0, 0, 0, 0, 0, 0, realStats.latestScore], color: "text-emerald-500", trendType: "positive", insight: realStats.latestScore > 0 ? "From your last scan" : "No scans yet" },
  ];

  const [exercises, setExercises] = useState<any[]>([]);

  const [sessions, setSessions] = useState<any[]>([]);

  const addSession = () => {
    const newSession = {
      id: Date.now(),
      title: "New Clinical Drill",
      type: "exercise",
      status: "pending",
      duration: "10 Min"
    };
    setSessions(prev => [...prev, newSession]);
  };

  const toggleExercise = (id: number) => {
    setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, completed: !ex.completed } : ex));
  };

  const completedCount = exercises.filter(ex => ex.completed).length;
  const totalCount = exercises.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById("dashboard-container");
      if (!element) return;
      toast.info("Generating PDF summary...");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Dashboard_Report.pdf");
      toast.success("PDF Downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const wsWeekly = XLSX.utils.json_to_sheet(emptyWeeklyData);
      XLSX.utils.book_append_sheet(wb, wsWeekly, "Weekly Activity");

      const wsExercises = XLSX.utils.json_to_sheet(exercises.map(e => ({ Exercise: e.name, Muscle: e.muscle, Duration: e.duration, Status: e.completed ? 'Completed' : 'Pending' })));
      XLSX.utils.book_append_sheet(wb, wsExercises, "Today Exercises");

      const wsMetrics = XLSX.utils.json_to_sheet(metrics.map(m => ({ Metric: m.label, Value: m.value, Trend: m.trend, Insight: m.insight })));
      XLSX.utils.book_append_sheet(wb, wsMetrics, "Core Metrics");

      XLSX.writeFile(wb, "Dashboard_Report.xlsx");
      toast.success("Excel Downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Excel");
    }
  };

  return (
    <motion.div
      id="dashboard-container"
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-10 max-w-[1700px] mx-auto pb-12"
    >
      {/* 🚀 PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 group">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground">Prism Dashboard</h1>
          <p className="text-muted-foreground mt-1">Intelligence-driven physiotherapy monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border border-slate-200 bg-white dark:bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-widest h-11 px-6 shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 group">
                <History className="w-4 h-4 mr-2 text-slate-500 group-hover:text-black transition-colors" /> Activity Logs
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-border bg-card shadow-elevated p-8">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-display font-black text-foreground uppercase tracking-tight">Recent Activity</DialogTitle>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Last 5 interactions</p>
              </DialogHeader>
              <div className="space-y-4">
                {loadingLogs ? (
                    <div className="py-20 text-center">
                        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Accessing Neon Ledger...</p>
                    </div>
                ) : dbLogs.length === 0 ? (
                    <div className="py-20 text-center bg-secondary/20 rounded-2xl border border-dashed border-border/50">
                        <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No clinical history recorded</p>
                    </div>
                ) : (
                  dbLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/40 hover:bg-white transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.type === 'posture' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {log.type === 'posture' ? <ScanEye className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-black text-foreground uppercase tracking-tighter truncate">{log.title}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{log.time}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black uppercase text-blue-500 border-blue-500/20 whitespace-nowrap">{log.result}</Badge>
                    </div>
                  ))
                )}
              </div>
              <Button className="w-full mt-6 rounded-xl bg-[#0B1220] text-white font-black h-12 uppercase text-[10px] tracking-widest shadow-lg" onClick={() => setIsLogOpen(false)}>Close History</Button>
            </DialogContent>
          </Dialog>
          <Button className="rounded-xl bg-accent-gradient text-white hover:shadow-glow font-black text-xs uppercase tracking-widest h-11 px-6 transition-all duration-300 hover:scale-[1.02] active:scale-95" onClick={() => navigate("/dashboard/posture")}>
            <Video className="w-4 h-4 mr-2" /> Start Posture Analysis
          </Button>
        </div>
      </div>

      {/* 🌟 HERO SECTION (SMART SUMMARY) */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 bg-gradient-to-br from-[#020617] via-[#0b1220] to-[#020617] rounded-[2rem] p-8 md:p-10 relative overflow-hidden border border-white/5 shadow-elevated min-h-[380px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-[80%] h-[120%] rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
            <div className="absolute -bottom-1/2 -left-1/4 w-[80%] h-[120%] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10 h-full">
            <div className="flex flex-col h-full justify-between max-w-xl text-left min-h-[inherit]">
              <div className="mt-2">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white leading-[1.1]">
                  Welcome back, <span className="text-blue-400 uppercase tracking-tighter">{user?.name?.split(' ')[0] || 'User'}</span>
                </h2>
                <p className="text-white/70 text-sm font-medium mt-3 max-w-md leading-relaxed">
                  {realStats.totalSessions > 0
                    ? `You have completed ${realStats.totalSessions} session${realStats.totalSessions > 1 ? 's' : ''} so far. ${realStats.avgPostureScore > 0 ? `Your average posture score is ${realStats.avgPostureScore}%.` : ''}`
                    : "Welcome to PRISM! Start a posture scan or exercise session to begin tracking your recovery."
                  }
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full flex items-center gap-3 group cursor-default shadow-glow-sm">
                     <Zap className="w-4 h-4 text-blue-400 fill-blue-400/20 animate-pulse" />
                     <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{realStats.totalSessions} Session{realStats.totalSessions !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-3 shadow-glow-sm">
                     <Target className="w-4 h-4 text-emerald-400" />
                     <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">{realStats.avgPostureScore > 0 ? `Score ${realStats.avgPostureScore}%` : 'New User'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-auto">
                <Button size="lg" className="rounded-xl bg-white hover:bg-white/90 text-[#0B1220] font-black px-6 h-12 text-sm shadow-xl transition-all group" onClick={() => navigate("/dashboard/tracker")}>
                  Start Session <Play className="w-4 h-4 ml-2 fill-current group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" variant="outline" className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 font-bold px-6 h-12 text-sm transition-all">
                      View Full Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-white/10 bg-[#0b1220] text-white p-8 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
                    <DialogHeader className="mb-8 relative z-10">
                      <DialogTitle className="text-2xl font-display font-black uppercase tracking-tight">Prescribed Training Plan</DialogTitle>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Doctor: Amanda Hayes · Physio Wing A</p>
                    </DialogHeader>
                    <div className="space-y-4 relative z-10 max-h-[40vh] overflow-y-auto pr-2 premium-scrollbar font-sans">
                      {[
                        { name: 'Cervical Extension', sets: '3 Sets x 12 Reps', focus: 'Neck Mobility' },
                        { name: 'Scapular Retraction', sets: '2 Sets x 15 Reps', focus: 'Upper Back' },
                        { name: 'Thoracic Rotation', sets: '3 Sets x 10 Reps', focus: 'Mid Back' },
                        { name: 'Lumbar Stabilization', sets: 'Hold 30s x 4', focus: 'Lower Back' }
                      ].map((ex, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                          <div className="flex flex-col gap-1">
                             <span className="text-sm font-black uppercase leading-none">{ex.name}</span>
                             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{ex.focus}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-[11px] font-bold text-blue-400 block">{ex.sets}</span>
                             <button className="text-[9px] font-black text-white/30 hover:text-white uppercase mt-1">Customize</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex gap-3 relative z-10">
                      <Button variant="outline" className="flex-1 rounded-xl border-white/10 text-white font-black uppercase text-[10px] tracking-widest h-12" onClick={() => setIsPlanOpen(false)}>Close</Button>
                      <Button className="flex-1 rounded-xl bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest h-12 shadow-glow">Save Changes</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="flex flex-col w-full md:w-[420px] h-full bg-gradient-to-br from-[#0B1220] to-[#1E293B] backdrop-blur-2xl rounded-[2rem] border border-white/10 p-5 self-stretch shadow-elevated relative overflow-hidden group/sidebar">
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
               <div className="flex justify-between items-center mb-4 relative z-10">
                 <h3 className="text-[10px] font-black tracking-[0.25em] text-sky-400/60 uppercase">Today's Focus</h3>
                 <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full shadow-glow-sm">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{exercises.length} Sessions</span>
                 </div>
               </div>
               <div className="space-y-2.5 relative z-10">
                 {exercises.length > 0 ? exercises.map(ex => (
                   <motion.div key={ex.id} whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.08)' }} whileTap={{ scale: 0.99 }} className={`flex flex-col gap-2 p-3 rounded-xl border border-white/5 transition-all cursor-pointer shadow-sm hover:shadow-glow-sm hover:border-white/20 ${ex.completed ? 'bg-white/[0.03]' : 'bg-white/[0.05]'}`} onClick={() => toggleExercise(ex.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner ${ex.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                              <Activity className={`w-4.5 h-4.5 ${ex.completed ? 'text-emerald-400' : 'text-blue-400'}`} />
                           </div>
                           <div className="flex flex-col">
                              <span className={`text-[11px] font-bold uppercase tracking-wide leading-tight ${ex.completed ? 'text-white/60' : 'text-white'}`}>{ex.name}</span>
                              <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest mt-0.5">{ex.muscle} • {ex.duration}</span>
                           </div>
                        </div>
                        <div className="flex items-center">
                          {ex.completed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                              <Check className="w-3 text-emerald-400 shadow-glow" strokeWidth={4} />
                            </div>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-glow animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-1000 ${ex.completed ? 'bg-gradient-to-r from-emerald-500 to-teal-400 w-full' : 'bg-gradient-to-r from-blue-500 to-indigo-500 w-[30%]'}`} />
                      </div>
                   </motion.div>
                 )) : (
                   <div className="flex flex-col items-center justify-center py-8 text-center">
                     <Activity className="w-8 h-8 text-white/20 mb-2" />
                     <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">No exercises yet</p>
                     <p className="text-[9px] text-white/20 mt-1">Start a session to track</p>
                   </div>
                 )}
               </div>
               <div className="mt-auto pt-4 border-t border-white/5 relative z-10">
                  <div className="flex items-end justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Daily Progress</span>
                      <span className="text-2xl font-display font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent leading-none">{totalCount > 0 ? progressPercent : 0}%</span>
                    </div>
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest pb-1">{completedCount} of {totalCount} Exercises</span>
                  </div>
                  <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div key={progressPercent} initial={{ width: 0 }} animate={{ width: `${totalCount > 0 ? progressPercent : 0}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-glow" />
                  </div>
                  <p className="mt-3 text-[8px] font-bold text-white/20 text-center uppercase tracking-widest">{totalCount > 0 ? 'Keep up the good work!' : 'Start your first session!'}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>

      {/* 🗓️ CALENDAR SECTION */}
      <div className="lg:col-span-12 bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-slate-200/50 shadow-elevated overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50/50 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none" />
          <div className="flex flex-col lg:flex-row gap-10 relative z-10">
             <div className="lg:w-[320px] flex flex-col pt-1">
                <div className="flex items-center justify-between mb-6">
                   <div>
                      <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">Schedule</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Clinical Plan</p>
                   </div>
                   <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <Button size="sm" variant="ghost" className="h-7 px-3 text-[9px] font-black rounded-lg bg-white shadow-sm text-slate-900 uppercase tracking-widest">Month</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-3 text-[9px] font-black rounded-lg text-slate-400 hover:text-slate-600 uppercase tracking-widest">Week</Button>
                   </div>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md h-full flex flex-col justify-center items-center overflow-hidden">
                  <div className="w-full max-w-[260px]">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={setDate} 
                      className="w-full pointer-events-auto" 
                      classNames={{ 
                        day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-lg shadow-glow-sm", 
                        day_today: "bg-slate-100 text-blue-600 font-black rounded-lg", 
                        day: "h-9 w-9 p-0 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center mx-auto text-[11px]", 
                        head_cell: "text-slate-400 font-black text-[9px] uppercase tracking-widest pb-4 text-center w-9",
                        cell: "p-0 text-center w-9",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse space-y-0.5",
                        head_row: "flex justify-between",
                        row: "flex w-full mt-1 justify-between",
                      }} 
                    />
                  </div>
                </div>
             </div>
             <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex flex-col items-center justify-center text-white shadow-glow">
                         <span className="text-[8px] font-black uppercase tracking-tighter leading-none opacity-80">{date?.toLocaleString('default', { month: 'short' })}</span>
                         <span className="text-base font-black leading-none mt-1">{date?.getDate()}</span>
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">{date?.toLocaleDateString('default', { weekday: 'long' })}</h4>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sessions.length} sessions scheduled</p>
                      </div>
                   </div>
                   <Button size="icon" variant="ghost" className="rounded-full hover:bg-slate-100 h-8 w-8 text-blue-600 bg-blue-50" onClick={addSession}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-4">
                   {sessions.length > 0 ? sessions.map((item, i) => (
                      <div key={item.id} className="flex gap-5 group/item cursor-pointer">
                         <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full border-[2px] border-white shadow-md transition-all duration-500 ring-2 mt-6 ${item.status === 'completed' ? 'bg-emerald-500 ring-emerald-500/10' : 'bg-blue-500 ring-blue-500/10 animate-pulse'}`} />
                            <div className="w-[1px] h-full bg-slate-100/60 mt-2 group-last/item:hidden" />
                         </div>
                         <div 
                           className={`flex-1 flex flex-col md:flex-row md:items-center justify-between p-3 rounded-2xl border transition-all duration-500 relative overflow-hidden ${
                             item.status === 'completed' 
                               ? 'bg-emerald-50/20 border-emerald-100/40 hover:bg-emerald-50/40' 
                               : 'bg-white/90 backdrop-blur-md border-slate-100 hover:border-blue-200 hover:shadow-card hover:bg-white active:scale-[0.995]'
                           }`}
                           onClick={() => item.status !== 'completed' && navigate('/dashboard/tracker')}
                         >
                            {item.status === 'completed' && <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-2xl rounded-full" />}
                            <div className="flex items-center gap-4 relative z-10">
                               <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover/item:scale-105 ${
                                 item.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'
                               }`}>
                                  {item.type === 'scan' ? <ScanEye className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                               </div>
                               <div className="flex flex-col gap-0.5">
                                  <h5 className="text-[13px] font-black text-slate-900 tracking-tight uppercase leading-tight group-hover/item:text-blue-600 transition-colors">{item.title}</h5>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[8px] font-black text-slate-400/80 uppercase tracking-widest">{item.duration}</span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 md:mt-0 relative z-10">
                               {item.status === 'completed' ? (
                                 <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500 rounded-full shadow-glow-sm">
                                   <Check className="w-2.5 h-2.5 text-white" strokeWidth={5} />
                                   <span className="text-[8px] font-black text-white uppercase tracking-widest">Done</span>
                                 </div>
                               ) : (
                                 <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[8px] tracking-widest h-7 px-4 shadow-sm" onClick={(e) => { e.stopPropagation(); navigate('/dashboard/tracker'); }}>
                                   Start <ChevronRight className="w-2.5 h-2.5 ml-1" />
                                 </Button>
                               )}
                            </div>
                         </div>
                      </div>
                   )) : (
                     <div className="flex flex-col items-center justify-center py-16 text-center">
                       <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
                       <p className="text-sm font-bold text-slate-400">No sessions scheduled</p>
                       <p className="text-[10px] text-slate-300 mt-1">Start a posture scan or exercise to begin</p>
                       <Button size="sm" className="mt-4 rounded-full bg-blue-600 text-white font-black uppercase text-[9px] tracking-widest h-8 px-5" onClick={() => navigate('/dashboard/tracker')}>Start Session</Button>
                     </div>
                   )}
                </div>
             </div>
          </div>
      </div>

      {/* 📊 KPI STATS ROW */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {metrics.map((s, i) => (
          <div key={i} className="group h-auto min-h-[140px] bg-card hover:bg-secondary/30 rounded-[1.25rem] p-5 border border-border/40 shadow-sm hover:shadow-glow transition-all duration-300 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all duration-500"><s.icon className={`w-4 h-4 ${s.color}`} /></div>
              <Badge variant="secondary" className={`bg-neutral-100 font-black text-[9px] py-0 px-2 rounded-full ${s.trendType === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>{s.trend}</Badge>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1"><span className="text-2xl font-display font-black tracking-tight text-foreground">{s.value}</span><SparklineChart data={s.sparkline} height={20} width={40} /></div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-none mb-1">{s.label}</p>
              <div className="text-[9px] font-bold text-emerald-500/80 bg-emerald-500/5 px-2 py-0.5 rounded-lg inline-block whitespace-nowrap overflow-hidden text-ellipsis max-w-full">{s.insight}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* 🧩 FULL WIDTH COLUMN STACK */}
      <div className="grid grid-cols-1 gap-8">
        <motion.div variants={item} className="bg-card rounded-[2rem] p-8 border border-border/40 shadow-elevated">
          <div className="flex items-center justify-between mb-8">
            <div><h3 className="text-xl font-display font-black text-foreground">Active Recovery Sequence</h3><p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">Personalized daily drills</p></div>
            <Button variant="ghost" className="text-blue-500 font-black text-xs hover:bg-blue-50 uppercase tracking-widest">Filter <Filter className="w-4 h-4 ml-2" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.length > 0 ? exercises.map((ex) => (
              <div key={ex.id} className="group relative flex items-center gap-5 p-4 rounded-[2rem] bg-white/50 backdrop-blur-xl border border-slate-200/60 hover:border-blue-300 hover:shadow-elevated transition-all duration-500 h-[120px] overflow-hidden">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 relative border border-slate-100 bg-slate-50">
                  {ex.img && <img src={ex.img} alt={ex.name} className="w-full h-full object-cover" />}
                  {ex.completed && (
                    <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center backdrop-blur-[1px]">
                      <Check className="text-white w-8 h-8 drop-shadow-lg" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-blue-500/60 tracking-widest bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{ex.muscle}</span>
                    <h4 className="text-[14px] font-black text-slate-900 uppercase tracking-tight truncate leading-tight">{ex.name}</h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-300" /> {ex.duration}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Activity className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-lg font-bold text-slate-400">No exercises recorded yet</p>
                <p className="text-sm text-slate-300 mt-1 mb-4">Complete an exercise session to see your recovery drills here</p>
                <Button className="rounded-full bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest h-10 px-6" onClick={() => navigate("/dashboard/tracker")}>
                  Start Exercise <Play className="w-3 h-3 ml-2 fill-current" />
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 bg-white rounded-[2.5rem] p-7 border border-slate-200 shadow-xl relative overflow-hidden group">
              {/* ✨ Header Section */}
              <div className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-4 relative z-10">
                <div className="flex flex-col items-start gap-1">
                  <h3 className="text-xl font-display font-bold text-slate-800 tracking-tight">
                    Weekly Activity
                  </h3>
                </div>
              </div>
              
              {/* 📊 Personalized Bar Chart (Photo Match) */}
              <div className="h-[280px] w-full relative z-10 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={emptyWeeklyData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    barGap={6}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={{ stroke: '#94a3b8' }} 
                      tickLine={false} 
                      tick={{ fontSize: 13, fontWeight: 500, fill: '#64748b' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={{ stroke: '#94a3b8' }} 
                      tickLine={{ stroke: '#94a3b8' }} 
                      domain={[0, 180]} 
                      ticks={[0, 45, 90, 135, 180]}
                      tick={{ fontSize: 13, fontWeight: 500, fill: '#64748b' }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white border border-slate-200 p-4 shadow-xl text-left min-w-[120px]">
                              <p className="text-lg font-medium text-slate-800 mb-2">{label}</p>
                              <div className="space-y-1">
                                <p className="text-[15px] font-normal text-blue-600">Reps : {payload[0].value}</p>
                                <p className="text-[15px] font-normal text-sky-500">Calories : {payload[1].value}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="reps" 
                      fill="#1d4ed8" /* Royal Blue */
                      radius={[0, 0, 0, 0]} 
                      maxBarSize={35}
                    />
                    <Bar 
                      dataKey="calories" 
                      fill="#38bdf8" /* Light Blue */
                      radius={[0, 0, 0, 0]} 
                      maxBarSize={35}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 🌟 Footer Metric Row */}
              <div className="mt-8 flex items-center justify-center gap-10 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-700" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reps Completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calories Burned</span>
                </div>
              </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-black text-xl text-slate-900 uppercase tracking-tight">Clinical Toolset</h3>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200/50">Unified Hub</span>
          </div>
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {[
              { title: "Live Scanner", desc: "Analysis", icon: Video, color: "text-blue-500", bg: "bg-blue-500/10", path: "/dashboard/posture" },
              { title: "Active Resume", desc: "Sessions", icon: MousePointer2, color: "text-indigo-500", bg: "bg-indigo-500/10", path: "/dashboard/tracker" },
              { title: "AI Assistant", desc: "Clinical Guard", icon: Bot, color: "text-purple-500", bg: "bg-purple-500/10", path: "/dashboard/chatbot" },
              { title: "Clinical Lib", desc: "Exercises", icon: Library, color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/dashboard/library" },
              { title: "Health BI", desc: "Analytics", icon: BarChart3, color: "text-amber-500", bg: "bg-amber-500/10", path: "/dashboard/reports" },
              { title: "Upload Scan", desc: "Processing", icon: FileText, color: "text-rose-500", bg: "bg-rose-500/10", path: "/dashboard/posture" },
            ].map((bt, i) => (
              <button 
                key={i} 
                onClick={() => navigate(bt.path)} 
                className="flex-1 group flex flex-col items-center justify-center text-center gap-2 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200/60 hover:border-transparent hover:bg-accent-gradient hover:shadow-glow transition-all duration-500 transform active:scale-95 h-28"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:bg-white/20 group-hover:rotate-[10deg] ${bt.bg} ${bt.color}`}>
                  <bt.icon className="w-4 h-4 group-hover:text-white" strokeWidth={2.5} />
                </div>
                <div className="space-y-0">
                  <h5 className="text-[9px] font-black text-slate-900 group-hover:text-white uppercase tracking-wider">{bt.title}</h5>
                  <p className="text-[7px] font-bold text-slate-400 group-hover:text-white/80 uppercase tracking-tighter">{bt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
