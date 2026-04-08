import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
    Activity, Heart, Calendar, Clock, Edit3,
    Download, FileText, CheckCircle2, AlertCircle,
    TrendingUp, List, Brain, History, Phone, Mail,
    User, Stethoscope, Video, MapPin, Plus, ChevronRight,
    TrendingDown, Info, Shield, Target, ArrowUpRight, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, AreaChart, Area,
    PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

const recoveryData = [
    { day: "Mon", score: 65, pain: 4, rom: 45, strength: 60 },
    { day: "Tue", score: 68, pain: 4, rom: 48, strength: 62 },
    { day: "Wed", score: 72, pain: 3, rom: 52, strength: 65 },
    { day: "Thu", score: 70, pain: 3, rom: 50, strength: 64 },
    { day: "Fri", score: 75, pain: 2, rom: 58, strength: 70 },
    { day: "Sat", score: 82, pain: 2, rom: 65, strength: 75 },
    { day: "Sun", score: 85, pain: 1, rom: 72, strength: 80 },
];

const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Comprehensive Mock Data
    const patient = {
        id: id,
        name: "Sarah Jenkins",
        age: 34,
        gender: "Female",
        phone: "+1 (555) 123-4567",
        email: "sarah.j@example.com",
        emergencyContact: "John Jenkins (Husband) - +1 (555) 987-6543",
        condition: "Post-ACL Surgery (Left)",
        surgeryDate: "Jan 12, 2024",
        assignedDoctor: "Dr. Himesh",
        recoveryProgress: 85,
        weeklyAdherence: 94,
        painLevel: 1,
        totalSessions: 42,
        missedSessions: 3,
        status: "Improving",
        avatar: "S"
    };

    const exercises = [
        { name: "Single Leg Stance", reps: "3 sets x 30 sec", progress: 90, video: "https://example.com/demo1", feedback: "Slight tremor in ankle" },
        { name: "Quad Sets", reps: "3 sets x 15 reps", progress: 100, video: "https://example.com/demo2", feedback: "Perfect form achieved" },
        { name: "Heel Slides", reps: "2 sets x 20 reps", progress: 75, video: "https://example.com/demo3", feedback: "Stiffness at end of range" },
    ];

    const appointments = [
        { date: "Feb 28, 2024", mode: "In-clinic", notes: "Post-op week 6 review. Progressing well.", file: "report_feb28.pdf" },
        { date: "Feb 14, 2024", mode: "Online", notes: "Virtual session to check exercise form.", file: "report_feb14.pdf" },
        { date: "Jan 30, 2024", mode: "In-clinic", notes: "Suture removal and initial assessment.", file: "report_jan30.pdf" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-4xl font-display font-bold border border-primary/20 shadow-inner">
                            {patient.avatar}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">{patient.name}</h1>
                                <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest border border-success/20">
                                    {patient.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <span className="flex items-center gap-2 text-muted-foreground text-sm font-bold bg-secondary/50 px-3 py-1 rounded-lg">
                                    <User className="w-4 h-4 text-primary" /> {patient.age} yrs • {patient.gender}
                                </span>
                                <span className="flex items-center gap-2 text-muted-foreground text-sm font-bold bg-secondary/50 px-3 py-1 rounded-lg">
                                    <Phone className="w-4 h-4 text-primary" /> {patient.phone}
                                </span>
                                <span className="flex items-center gap-2 text-muted-foreground text-sm font-bold bg-secondary/50 px-3 py-1 rounded-lg">
                                    <Mail className="w-4 h-4 text-primary" /> {patient.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <Button variant="outline" className="flex-1 lg:flex-none h-12 rounded-xl border-black dark:border-white font-bold hover:bg-secondary transition-all">
                        <Edit3 className="w-4 h-4 mr-2" /> Edit Patient
                    </Button>
                    <Button className="flex-1 lg:flex-none h-12 rounded-xl bg-accent-gradient text-white font-bold shadow-glow hover:scale-105 transition-all">
                        <Download className="w-4 h-4 mr-2" /> Export Case
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Condition", value: patient.condition, icon: Activity, color: "text-primary", action: null },
                    { label: "Pain Timeline", value: "View History", icon: TrendingDown, color: "text-amber-500", action: () => document.getElementById('pain-timeline')?.scrollIntoView({ behavior: 'smooth' }) },
                    { label: "Schedule a Meeting", value: "Zoom / In-Clinic", icon: Video, color: "text-accent", action: () => { } },
                    { label: "Reports", value: "Medical Records", icon: FileText, color: "text-prism-sky", action: () => { } },
                ].map((item, idx) => (
                    <Card
                        key={idx}
                        onClick={item.action || undefined}
                        className={`p-6 bg-glass border-white/20 rounded-3xl anti-gravity relative overflow-hidden group ${item.action ? 'cursor-pointer' : ''}`}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center ${item.color}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{item.label}</span>
                            </div>
                            <p className="text-lg font-bold text-foreground tracking-tight">{item.value}</p>
                        </div>

                        {/* See More Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-end pr-8 translate-y-full group-hover:translate-y-0 transition-all duration-500 backdrop-blur-[2px] rounded-b-[2.5rem] pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                See More <ArrowUpRight className="w-3 h-3" />
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Dashboard Visuals Row */}
            {/* 2️⃣ Detailed Recovery Dashboard Section - Full Width */}
            <section className="bg-glass/10 border-y border-white/10 -mx-8 px-8 py-12 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] pointer-events-none" />
                <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2 block">Performance Monitoring</span>
                            <h2 className="text-4xl font-display font-bold text-foreground">Recovery Dashboard</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="p-4 bg-secondary/30 rounded-2xl border border-white/10 backdrop-blur-sm">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Last Update</p>
                                <p className="text-sm font-bold text-foreground">Today at 09:12 AM</p>
                            </div>
                            <Button variant="outline" className="h-full rounded-2xl px-6 border-white/10 bg-white/5 group-hover:bg-white/10 transition-all">
                                <Activity className="w-5 h-5 mr-2 text-primary" /> View Baseline
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Phase 1: Progressive Recovery Circle (3 cols) */}
                        <div className="xl:col-span-3 flex flex-col items-center justify-center p-8 bg-glass border border-white/20 rounded-[3rem] shadow-glow-sm anti-gravity group/circle relative">
                            <div className="relative w-64 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: "Progress", value: patient.recoveryProgress },
                                                { name: "Remaining", value: 100 - patient.recoveryProgress }
                                            ]}
                                            cx="50%" cy="50%" innerRadius={85} outerRadius={110}
                                            paddingAngle={4} dataKey="value" startAngle={90} endAngle={450}
                                        >
                                            <Cell fill="hsl(var(--primary))" stroke="none" className="drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                            <Cell fill="rgba(0,0,0,0.05)" stroke="none" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Clinical</span>
                                    <span className="text-6xl font-display font-black text-foreground">{patient.recoveryProgress}%</span>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Recovery</span>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-2 gap-4 w-full px-4">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-foreground">{patient.recoveryProgress}%</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Compliance</p>
                                </div>
                                <div className="text-center border-l border-white/10">
                                    <p className="text-2xl font-black text-primary">+4%</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Vs Predicted</p>
                                </div>
                            </div>
                        </div>

                        {/* Phase 2: Matrix of Metrics (6 cols) */}
                        <div className="xl:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-6">
                            {[
                                { label: "Adherence Rate", value: `${patient.weeklyAdherence}%`, icon: CheckCircle2, sub: "Consistency: High", color: "text-success", trend: "up" },
                                { label: "Pain Response", value: `${patient.painLevel}/10`, icon: Heart, sub: "Threshold: Decr.", color: "text-amber-500", trend: "down" },
                                { label: "Clinical Power", value: "+18%", icon: TrendingUp, sub: "Strength Index", color: "text-accent", trend: "up" },
                                { label: "Range of Motion", value: "115°", icon: Activity, sub: "Flexion Limit", color: "text-primary", trend: "up" },
                                { label: "Completed Steps", value: patient.totalSessions, icon: Calendar, sub: "Of 45 Target", color: "text-prism-sky", trend: "neutral" },
                                { label: "Missed Alerts", value: patient.missedSessions, icon: AlertCircle, sub: "Critical < 5", color: "text-destructive", trend: "neutral" },
                            ].map((m, i) => (
                                <div key={i} className="p-8 rounded-[2.5rem] bg-glass border border-white/10 shadow-elevated-sm anti-gravity group/m relative overflow-hidden h-[180px]">
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex items-start justify-between">
                                            <div className={`w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center ${m.color}`}>
                                                <m.icon className="w-6 h-6" />
                                            </div>
                                            {m.trend !== 'neutral' && (
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${m.trend === 'up' ? 'bg-success/10 text-success' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {m.trend === 'up' ? '↑ Increasing' : '↓ Decreasing'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{m.label}</p>
                                            <p className="text-4xl font-display font-black text-foreground tabular-nums tracking-tighter">{m.value}</p>
                                        </div>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover/m:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>

                        {/* Phase 3: AI Sentiment & Activity (3 cols) */}
                        <div className="xl:col-span-3 space-y-6 flex flex-col">
                            <Card className="flex-1 p-8 bg-primary/5 border border-primary/20 rounded-[3rem] shadow-glow anti-gravity relative overflow-hidden group/ai">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />
                                <h3 className="text-xl font-display font-bold mb-6 text-foreground flex items-center gap-3">
                                    <Brain className="w-7 h-7 text-primary" /> AI Smart Audit
                                </h3>
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/50 dark:bg-black/20 border border-primary/10 transition-colors hover:bg-white/80 dark:hover:bg-black/40">
                                        <div className="flex items-start gap-3">
                                            <TrendingUp className="w-6 h-6 text-success shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-foreground">Acceleration Phase</p>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Neural analysis predicts full functional mobility 4 days ahead of schedule.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/10 transition-colors hover:bg-amber-500/20">
                                        <div className="flex items-start gap-3">
                                            <Shield className="w-6 h-6 text-amber-500 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-amber-600">Adaptive Safety</p>
                                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Minor lateral instability detected. Locking ROM at 110° for next 2 sessions.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button className="w-full h-14 rounded-2xl bg-secondary text-primary font-black uppercase tracking-widest text-[10px] hover:bg-secondary/100 border border-primary/10 shadow-sm transition-all">Generate Detailed AI Audit</Button>
                                </div>
                            </Card>

                            {/* Activity Streak Widget */}
                            <div className="p-8 rounded-[3rem] bg-slate-900 dark:bg-slate-950 text-white shadow-elevated relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full -mr-12 -mt-12" />
                                <div className="relative z-10 flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Activity Streak</p>
                                        <p className="text-2xl font-bold">14 Days</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex justify-between gap-2">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                            <div className={`w-3.5 h-3.5 rounded-full ${i < 6 ? 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} />
                                            <span className="text-[8px] font-black uppercase opacity-40">{day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Section See More Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-end pr-8 translate-y-full group-hover:translate-y-0 transition-all duration-500 backdrop-blur-[2px] pointer-events-none">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        See More <ArrowUpRight className="w-3 h-3" />
                    </span>
                </div>
            </section>

            {/* 3️⃣ Performance & Program Section - Adjusted Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-8 bg-glass border-white/20 rounded-[2.5rem] shadow-elevated anti-gravity relative overflow-hidden group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-foreground tracking-tight">Recovery Performance</h3>
                                <p className="text-sm text-muted-foreground">Multi-vector improvement analytics</p>
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl">
                                <Button size="sm" variant="ghost" className="rounded-lg h-8 px-4 text-xs font-bold bg-white shadow-sm">Weekly</Button>
                                <Button size="sm" variant="ghost" className="rounded-lg h-8 px-4 text-xs font-bold text-muted-foreground">Monthly</Button>
                            </div>
                        </div>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={recoveryData}>
                                    <defs>
                                        <linearGradient id="colorROM" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '20px',
                                            border: 'none',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                            background: 'rgba(255,255,255,0.95)',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="rom" name="Range of Motion" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorROM)" />
                                    <Area type="monotone" dataKey="strength" name="Muscle Strength" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                                    <Line type="monotone" dataKey="pain" name="Pain Level" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* See More Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-end pr-8 translate-y-full group-hover:translate-y-0 transition-all duration-500 backdrop-blur-[2px] rounded-b-[2.5rem] pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                See More <ArrowUpRight className="w-3 h-3" />
                            </span>
                        </div>
                    </Card>

                    {/* 4️⃣ Exercise Program Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                                <List className="w-7 h-7 text-primary" /> Active Rehab Program
                            </h3>
                            <Button className="rounded-xl bg-primary text-white font-bold h-11 px-5 shadow-glow hover:scale-105 transition-all">
                                <Plus className="w-5 h-5 mr-1" /> Add Exercise
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {exercises.map((ex, i) => (
                                <Card key={i} className="p-6 bg-glass border-white/20 rounded-3xl anti-gravity group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="w-full md:w-48 h-32 rounded-2xl bg-black/5 flex items-center justify-center relative group-hover:bg-black/10 transition-colors cursor-pointer overflow-hidden border border-border/50">
                                            <Video className="w-10 h-10 text-primary opacity-50 group-hover:scale-110 transition-transform" />
                                            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-primary">Demo View</div>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xl font-display font-bold text-foreground">{ex.name}</h4>
                                                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">{ex.reps}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden relative border border-border/30">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${ex.progress}%` }}
                                                        className="absolute inset-y-0 left-0 bg-primary"
                                                    />
                                                </div>
                                                <span className="text-sm font-black text-foreground">{ex.progress}%</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-secondary/50 border border-border/30">
                                                <p className="text-xs font-medium text-muted-foreground flex items-start gap-2 italic">
                                                    <Info className="w-4 h-4 text-primary shrink-0 not-italic" /> "{ex.feedback}"
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50 self-end md:self-center">
                                            <ChevronRight className="w-6 h-6 text-muted-foreground" />
                                        </Button>
                                    </div>

                                    {/* See More Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-end pr-8 translate-y-full group-hover:translate-y-0 transition-all duration-500 backdrop-blur-[2px] rounded-b-[2.5rem] pointer-events-none">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                            See More <ArrowUpRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 5️⃣ Appointment History */}
                <Card className="lg:col-span-1 p-8 bg-glass border-white/20 rounded-[2.5rem] shadow-elevated anti-gravity relative overflow-hidden group">
                    <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-3 mb-8">
                        <History className="w-6 h-6 text-prism-sky" /> Analytics & History
                    </h3>
                    <div className="space-y-4">
                        {appointments.map((app, idx) => (
                            <div key={idx} className="group p-5 rounded-3xl border border-border/30 bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{app.date}</p>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mt-1 ${app.mode === 'Online' ? 'text-primary' : 'text-prism-sky'}`}>
                                            {app.mode === 'Online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />} {app.mode}
                                        </span>
                                    </div>
                                    <Button size="icon" variant="ghost" className="rounded-full bg-white shadow-sm">
                                        <Download className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed italic">"{app.notes}"</p>
                            </div>
                        ))}
                        <Button className="w-full h-12 rounded-xl bg-secondary text-foreground font-bold hover:bg-secondary/100 transition-all">View All Records</Button>
                    </div>

                    {/* See More Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-end pr-8 translate-y-full group-hover:translate-y-0 transition-all duration-500 backdrop-blur-[2px] rounded-b-[2.5rem] pointer-events-none">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                            See More <ArrowUpRight className="w-3 h-3" />
                        </span>
                    </div>
                </Card>

                {/* 6️⃣ Pain Tracking & 7️⃣ Doctor Notes */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Pain Tracking Timeline */}
                        <Card id="pain-timeline" className="p-8 bg-glass border-white/20 rounded-[2.5rem] shadow-elevated anti-gravity relative overflow-hidden group">
                            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-3 mb-6 relative z-10">
                                <TrendingDown className="w-6 h-6 text-amber-500" /> Pain Timeline
                            </h3>
                            <div className="h-[200px] relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={recoveryData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} hide />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                        <Bar dataKey="pain" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Primary Trigger</p>
                                <p className="text-sm font-bold text-foreground">Extreme extension beyond 110°</p>
                            </div>

                            {/* See More Overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-end pr-8 translate-y-full group-hover:translate-y-0 transition-all duration-500 backdrop-blur-[2px] rounded-b-[2.5rem] pointer-events-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    See More <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </div>
                        </Card>

                        {/* Doctor Notes Section */}
                        <Card className="p-8 bg-glass border-white/20 rounded-[2.5rem] shadow-elevated anti-gravity">
                            <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-3 mb-6">
                                <FileText className="w-6 h-6 text-primary" /> Clinical Observations
                            </h3>
                            <div className="space-y-5">
                                <textarea
                                    className="w-full bg-secondary/50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-primary/20 min-h-[140px] resize-none placeholder:text-muted-foreground/50"
                                    placeholder="Add manual comments or internal remarks..."
                                />
                                <div className="flex gap-2">
                                    <Button className="flex-1 h-12 rounded-xl bg-slate-900 dark:bg-primary text-white font-bold shadow-glow transition-all">Save Observation</Button>
                                    <Button variant="outline" className="w-12 h-12 rounded-xl border-border/50"><Plus className="w-5 h-5" /></Button>
                                </div>
                            </div>

                            {/* See More Overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 via-primary/5 to-transparent flex items-center justify-end pr-8 translate-y-full group-hover:translate-y-0 transition-all duration-500 backdrop-blur-[2px] rounded-b-[2.5rem] pointer-events-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    See More <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </div>
                        </Card>
                    </div>

                    {/* AI Predicted Timeline Banner */}
                    <Card className="p-6 bg-accent-gradient text-white rounded-[2rem] shadow-glow overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 blur-[80px] -mr-32 -mt-32" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                    <Target className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-display font-bold">AI Projected Recovery Milestone</h4>
                                    <p className="text-sm text-white/80">Full unrestricted sports participation predicted within 18 days.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 block mb-1">Confidence Score</span>
                                <span className="text-3xl font-display font-bold">92%</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default PatientDetail;
