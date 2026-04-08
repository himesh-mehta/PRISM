import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Activity, ScanEye, Library, BarChart3, TrendingUp, Clock, Target, Heart, Brain,
  AlertTriangle, CheckCircle2, ArrowUpRight, Zap, CalendarDays, User2, MessageCircle,
  Play, FileText, Smartphone, Plus, Award, Info, Bot, Table, Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SparklineChart from "@/components/SparklineChart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const weeklyData = [
  { day: "Mon", pain: 4, accuracy: 72, sessions: 2 },
  { day: "Tue", pain: 4, accuracy: 78, sessions: 3 },
  { day: "Wed", pain: 3, accuracy: 65, sessions: 1 },
  { day: "Thu", pain: 3, accuracy: 82, sessions: 4 },
  { day: "Fri", pain: 2, accuracy: 76, sessions: 2 },
  { day: "Sat", pain: 2, accuracy: 85, sessions: 3 },
  { day: "Sun", pain: 2, accuracy: 80, sessions: 1 },
];

const timelineData = [
  { week: "W1", pain: 6, form: 65, color: "text-red-400" },
  { week: "W2", pain: 5, form: 70, color: "text-orange-400" },
  { week: "W3", pain: 4, form: 74, color: "text-amber-400" },
  { week: "W4", pain: 3, form: 79, color: "text-yellow-400" },
  { week: "W5", pain: 3, form: 82, color: "text-emerald-400" },
  { week: "W6", pain: 2, form: 88, color: "text-success" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const Dashboard = () => {
  const [painLevel, setPainLevel] = useState([3]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const todayExercises = [
    { id: 1, name: "Cervical Extension", duration: "10 mins", status: "pending", type: "Neck" },
    { id: 2, name: "Scapular Squeezes", duration: "8 mins", status: "completed", type: "Back" },
    { id: 3, name: "Shoulder Flexion", duration: "12 mins", status: "pending", type: "Shoulder" },
  ];

  const metrics = [
    { label: "Pain Level Today", value: `${painLevel[0]}/10`, trend: "-1pt", icon: AlertTriangle, sparkline: [5, 5, 4, 3, 4, 3, painLevel[0]], color: "text-amber-500", customEl: (
      <div className="flex flex-col gap-2 w-full mt-1">
        <Slider value={painLevel} onValueChange={setPainLevel} max={10} step={1} className="w-full h-1.5" />
      </div>
    ) },
    { label: "AI Posture Score", value: "85", trend: "+5%", icon: ScanEye, sparkline: [65, 70, 72, 75, 78, 82, 85], color: "text-prism-sky" },
    { label: "Recovery Progress", value: "72%", trend: "+12%", icon: Target, sparkline: [40, 45, 50, 52, 58, 65, 72], color: "text-success" },
    { label: "Session Streak", value: "14 Days", trend: "+2", icon: Award, sparkline: [3, 4, 5, 6, 12, 13, 14], color: "text-purple-500" },
    { label: "Weekly Train Time", value: "12.5h", trend: "+2.5h", icon: Clock, sparkline: [6, 7, 8, 9, 10, 11, 12.5], color: "text-warning" },
  ];

  const insights = [
    { icon: TrendingUp, text: "Posture improved 12% this week.", type: "positive", risk: "Low Risk" },
    { icon: AlertTriangle, text: "Left shoulder imbalance detected 2 times.", type: "warning", risk: "Medium Risk" },
    { icon: Info, text: "You tend to fatigue after 15 minutes.", type: "neutral", risk: "General Risk" },
  ];

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
      
      const wsWeekly = XLSX.utils.json_to_sheet(weeklyData);
      XLSX.utils.book_append_sheet(wb, wsWeekly, "Weekly Activity");

      const wsTimeline = XLSX.utils.json_to_sheet(timelineData.map(t => ({ Week: t.week, 'Pain/10': t.pain, 'Form %': t.form })));
      XLSX.utils.book_append_sheet(wb, wsTimeline, "Recovery Timeline");

      const wsExercises = XLSX.utils.json_to_sheet(todayExercises.map(e => ({ Exercise: e.name, Type: e.type, Duration: e.duration, Status: e.status })));
      XLSX.utils.book_append_sheet(wb, wsExercises, "Today Exercises");

      const wsMetrics = XLSX.utils.json_to_sheet(metrics.map(m => ({ Metric: m.label, Value: m.value, Trend: m.trend })));
      XLSX.utils.book_append_sheet(wb, wsMetrics, "Core Metrics");

      const wsInsights = XLSX.utils.json_to_sheet(insights.map(i => ({ Insight: i.text, Status: i.type, Risk: i.risk })));
      XLSX.utils.book_append_sheet(wb, wsInsights, "AI Insights");

      XLSX.writeFile(wb, "Dashboard_Report.xlsx");
      toast.success("Excel Downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Excel");
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12" id="dashboard-container">
      
      {/* 1. Top Section — Welcome + Today Recovery Plan */}
      <motion.div variants={item} className="bg-gradient-to-r from-[#1e40af] via-[#3730a3] to-[#6d28d9] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-96 h-96 rounded-full bg-cyan-400 blur-[100px] opacity-20" />
          <div className="absolute -bottom-12 -left-12 w-96 h-96 rounded-full bg-fuchsia-500 blur-[100px] opacity-20" />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-indigo-300 blur-[80px] opacity-20 -translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
              Welcome Back, {user?.name ? user.name.split(" ")[0] : "User"}!
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-lg leading-relaxed">
              Today's recovery focus is core stability and shoulder range-of-motion. 
              <span className="font-semibold block mt-1 text-amber-300 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Note: Avoid overhead heavy strain today.</span>
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="bg-white hover:bg-white/90 text-[#3730a3] font-bold rounded-2xl px-8 shadow-lg active:scale-95 transition-all flex items-center gap-2 group" onClick={() => navigate("/dashboard/tracker")}>
                Start Session <Play className="w-4 h-4 fill-[#3730a3] group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="bg-white/5 border-white/20 hover:bg-white/10 text-white rounded-2xl px-6 active:scale-95 transition-all">
                View Plan
              </Button>
              <Button size="icon" variant="outline" onClick={handleExportPDF} className="bg-white/5 border-white/20 hover:bg-white/10 text-white rounded-2xl w-11 h-11" title="Export as PDF">
                <FileText className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleExportExcel} className="bg-white/5 border-white/20 hover:bg-white/10 text-white rounded-2xl w-11 h-11" title="Export as Excel">
                <Table className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Today's Schedule Card inside Hero */}
          <div className="w-full md:w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-xs font-black tracking-wider text-white">TODAY'S PLAN</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">30m Total</span>
            </div>
            <div className="space-y-2">
              {todayExercises.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5 hover:bg-white/10 hover:translate-x-0.5 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    {ex.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold leading-none">{ex.name}</p>
                      <p className="text-[10px] text-white/50 mt-0.5">{ex.type} · {ex.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

        {/* 2. Quick Health Metrics Row (5 Cards Grid) */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {metrics.map((s) => (
            <div key={s.label} onClick={() => setSelectedMetric(selectedMetric === s.label ? null : s.label)} className="group relative overflow-hidden bg-white hover:bg-neutral-50/50 rounded-2xl p-5 border border-neutral-200/60 flex flex-col justify-between h-36 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-300 anti-gravity">
              <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-10 ${s.color.replace('text-', 'bg-')}`} />
              
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className={`w-9 h-9 rounded-xl bg-orange-100/10 flex items-center justify-center transition-all duration-300`} style={{ backgroundColor: s.color.includes('amber') ? '#fef3c7' : s.color.includes('prism') ? '#e0f2fe' : s.color.includes('success') ? '#d1fae5' : s.color.includes('purple') ? '#f3e8ff' : '#ffedd5' }}>
                  <s.icon className={`w-[18px] h-[18px] ${s.color}`} />
                </div>
                <span className={`flex items-center gap-0.5 text-[11px] font-bold ${s.trend?.startsWith('+') || s.trend?.startsWith('-') ? (s.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50') : 'text-muted-foreground bg-neutral-100'} px-2 py-0.5 rounded-full`}>
                  {s.trend}
                </span>
              </div>
              
              <div className="relative z-10">
                <p className="font-display text-2xl font-black text-neutral-900 tracking-tight">{s.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-neutral-500 font-bold tracking-wide uppercase">{s.label.split(' Today')[0]}</p>
                  {s.customEl ? null : <SparklineChart data={s.sparkline} height={20} width={48} />}
                </div>
                {s.customEl}
              </div>
            </div>
          ))}
        </motion.div>

        {selectedMetric && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="p-4 bg-gradient-to-br from-neutral-50 to-white rounded-2xl border border-neutral-200/60 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-display font-bold text-neutral-800 text-xs flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Details: {selectedMetric}</h4>
              <Button size="sm" variant="ghost" onClick={() => setSelectedMetric(null)} className="h-6 p-1 text-neutral-400 hover:text-neutral-600">Close</Button>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <p className="text-xs text-neutral-600 font-medium">Your progress looks solid. Average score is elevating incrementally month over month in consecutive batches setup flawlessly.</p>
              </div>
              <div className="flex items-center gap-3 bg-neutral-100/50 p-2 rounded-xl">
                 <div>
                   <p className="text-[10px] text-neutral-400 font-bold uppercase">Weekly Trend</p>
                   <p className="font-black text-sm text-neutral-900">+12%</p>
                 </div>
                 <div className="w-16 h-8 bg-neutral-200/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* 3. AI Recovery Insights Panel (Glassmorphism) */}
          <motion.div variants={item} className="bg-gradient-to-br from-prism-navy/80 to-prism-blue/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-white overflow-hidden shadow-elevated">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <Brain className="w-6 h-6 text-prism-sky" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold tracking-tight">AI Recovery Diagnostics</h2>
                <p className="text-xs text-white/60">Smarter analysis for quicker improvement</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {insights.map((ins, i) => (
                <div key={i} className="bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <ins.icon className={`w-4 h-4 ${ins.type === "warning" ? "text-amber-400" : "text-emerald-400"}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${ins.type === "warning" ? "text-amber-400" : "text-emerald-400"}`}>
                      {ins.risk}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium text-white/90">{ins.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 4. Progress & Timeline Section (Combined) */}
          <motion.div variants={item} className="bg-card rounded-2xl p-6 border border-border flex flex-col sm:flex-row gap-6">
            {/* Timeline View */}
            <div className="flex-1">
              <h3 className="font-display font-bold text-base text-foreground mb-4">Recovery Timeline</h3>
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-4">
                {timelineData.map((t, i) => (
                  <div key={t.week} className="relative flex items-center justify-between">
                    <div className="absolute left-[-29px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.week} - Week {i + 1}</p>
                      <p className="text-[11px] text-muted-foreground">Form accuracy up to {t.form}%</p>
                    </div>
                    <span className={`text-[11px] font-bold ${t.color}`}>Pain: {t.pain}/10</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pain Trend Chart */}
            <div className="flex-1 h-[200px] sm:h-auto">
              <h3 className="font-display font-bold text-base text-foreground mb-4">Weekly Pain Trend</h3>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0f172a", border: "0", borderRadius: "8px", fontSize: 12, color: "#fff" }} />
                  <Area type="monotone" dataKey="pain" stroke="#f43f5e" fill="url(#painGrad)" strokeWidth={2} dot={{ r: 3, strokeWidth: 1, fill: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* 5. Therapist Communication Card */}
          <motion.div variants={item} className="bg-card rounded-2xl p-6 border border-border flex flex-col h-full justify-between anti-gravity">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-accent-gradient flex items-center justify-center font-bold text-white shadow-sm">DA</div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">Dr. Ananya Sharma</h3>
                  <p className="text-[10px] text-success font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Online
                  </p>
                </div>
              </div>
              <div className="bg-secondary p-3 rounded-xl border border-border relative mb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  "Great progress on the shoulder mobility! Let's increase the reps on exercise 2 tomorrow by 2."
                </p>
                <div className="absolute right-3 bottom-1.5 text-[9px] text-slate-400">10:42 AM</div>
              </div>
              <div className="border border-dashed border-border p-3 rounded-xl flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold text-foreground">Next Consultation</span>
                </div>
                <span className="text-[11px] font-semibold text-primary">Fri, 2 PM</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold active:scale-95 transition-all">
                Reply <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl border-border text-xs active:scale-95 transition-all">
                Reschedule
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 6 & 7. Smart Actions & Recovery Prediction Row */}
      <motion.div variants={item} className="grid md:grid-cols-3 gap-6">
        
        {/* 6. Smart Actions Panel */}
        <div className="md:col-span-2 bg-card rounded-2xl p-6 border border-border">
          <h3 className="font-display font-bold text-base text-foreground mb-4">Smart Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Open AI Bot", icon: Bot, class: "bg-prism-sky/10 text-prism-sky", path: "/dashboard/chatbot" },
              { label: "Open Library", icon: Library, class: "bg-primary/10 text-primary", path: "/dashboard/library" },
              { label: "Post Camera", icon: ScanEye, class: "bg-emerald-500/10 text-emerald-500", path: "/dashboard/posture" },
              { label: "Reports", icon: BarChart3, class: "bg-warning/10 text-warning", path: "/dashboard/reports" },
            ].map((bt) => (
              <button key={bt.label} onClick={() => navigate(bt.path)} className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-secondary hover:bg-accent-gradient hover:text-white border border-border hover:border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors group-hover:bg-white/20 ${bt.class}`}>
                  <bt.icon className="w-5 h-5 group-hover:text-white" />
                </div>
                <span className="text-xs font-bold group-hover:text-white">{bt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 7. Recovery Prediction Widget (Futuristic) */}
        <div className="bg-gradient-to-br from-prism-indigo/10 via-background to-card rounded-2xl p-6 border border-border flex items-center justify-between relative overflow-hidden anti-gravity">
          <div className="absolute right-[-10%] bottom-[-10%] w-32 h-32 rounded-full bg-prism-sky/10 blur-2xl" />
          <div>
            <span className="inline-block px-3 py-1 bg-prism-sky/10 text-prism-sky text-[10px] font-bold uppercase tracking-wider rounded-full mb-2">Futuristic View</span>
            <h3 className="font-display text-2xl font-black text-foreground">14 Days</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Estimated fully recovery with <span className="text-success font-bold">94% Confidence</span>.</p>
          </div>
          <div className="relative flex-shrink-0 w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" className="text-secondary" fill="transparent" />
              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" className="text-prism-sky" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 * (1 - 0.72)} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-foreground">72%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
