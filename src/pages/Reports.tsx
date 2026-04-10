import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Activity, Heart, Target, Flame, TrendingUp, Award, Calendar, Clock, FileText, Table, ScanEye, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const Reports = () => {
  const { user } = useAuth();
  const [postureHistory, setPostureHistory] = useState<any[]>([]);
  const [exerciseMetrics, setExerciseMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        // Get IDs from auth context OR localStorage fallback
        const savedUser = localStorage.getItem("prism_user");
        const localUser = savedUser ? JSON.parse(savedUser) : null;
        const patientId = user?.patient_id || localUser?.patient_id;
        const userId = user?.user_id || localUser?.user_id;

        if (!patientId && !userId) {
          setLoading(false);
          return;
        }

        // 1. Fetch Posture History
        if (patientId) {
          const pRes = await fetch(`/api/posture-history?patientId=${patientId}`);
          const pData = await pRes.json();
          if (pData.success) {
            setPostureHistory(pData.sessions || []);
          }
        }

        // 2. Fetch Exercise History
        if (userId) {
          const eRes = await fetch(`/api/exercise-history?userId=${userId}`);
          const eData = await eRes.json();
          if (eData.success) {
            setExerciseMetrics(eData.metrics || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
        toast.error("Failed to load historical data");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // Compute real stats from DB data
  const totalPostureSessions = postureHistory.length;
  const totalExerciseSessions = exerciseMetrics.length;
  const totalSessions = totalPostureSessions + totalExerciseSessions;
  const avgPostureScore = totalPostureSessions > 0
    ? Math.round(postureHistory.reduce((acc, s) => acc + (s.overall_score || 0), 0) / totalPostureSessions)
    : 0;
  const latestScore = totalPostureSessions > 0 ? (postureHistory[0]?.overall_score || 0) : 0;

  const summaryCards = [
    { label: "Total Sessions", value: `${totalSessions}`, icon: Activity, color: "text-blue-500" },
    { label: "Posture Scans", value: `${totalPostureSessions}`, icon: ScanEye, color: "text-indigo-500" },
    { label: "Avg Posture Score", value: avgPostureScore > 0 ? `${avgPostureScore}%` : "—", icon: Award, color: "text-green-500" },
    { label: "Latest Score", value: latestScore > 0 ? `${latestScore}%` : "—", icon: Target, color: "text-amber-500" },
    { label: "Exercise Sessions", value: `${totalExerciseSessions}`, icon: Flame, color: "text-orange-500" },
    { label: "BMI", value: user?.bmi ? `${user.bmi}` : "—", icon: Heart, color: "text-red-500" },
  ];

  // Build score distribution for pie chart from posture data
  const scoreRanges = { "90-100%": 0, "70-89%": 0, "40-69%": 0, "0-39%": 0 };
  postureHistory.forEach(s => {
    const score = s.overall_score || 0;
    if (score >= 90) scoreRanges["90-100%"]++;
    else if (score >= 70) scoreRanges["70-89%"]++;
    else if (score >= 40) scoreRanges["40-69%"]++;
    else scoreRanges["0-39%"]++;
  });
  const pieData = [
    { name: "Excellent (90-100%)", value: scoreRanges["90-100%"], color: "#10b981" },
    { name: "Good (70-89%)", value: scoreRanges["70-89%"], color: "#3b82f6" },
    { name: "Fair (40-69%)", value: scoreRanges["40-69%"], color: "#f59e0b" },
    { name: "Needs Work (0-39%)", value: scoreRanges["0-39%"], color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Build timeline chart data from posture sessions (most recent 10)
  const timelineData = [...postureHistory].reverse().slice(-10).map(s => ({
    date: new Date(s.finished_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: s.overall_score || 0,
  }));

  const handleExportPDF = async () => {
    try {
      const element = document.getElementById("reports-container");
      if (!element) return;
      toast.info("Generating PDF summary...");
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Recovery_Report.pdf");
      toast.success("PDF Downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Posture sessions sheet
      if (postureHistory.length > 0) {
        const posData = postureHistory.map(s => ({
          Date: new Date(s.finished_at).toLocaleString(),
          'Overall Score': s.overall_score,
          Findings: (s.report_data?.findings || []).map((f: any) => f.title).join(', ') || 'N/A',
        }));
        const wsPosure = XLSX.utils.json_to_sheet(posData);
        XLSX.utils.book_append_sheet(wb, wsPosure, "Posture Sessions");
      }

      // Exercise metrics sheet
      if (exerciseMetrics.length > 0) {
        const exData = exerciseMetrics.map(m => ({
          Type: m.metric_type,
          Value: m.metric_value,
          Date: new Date(m.recorded_at).toLocaleString(),
        }));
        const wsEx = XLSX.utils.json_to_sheet(exData);
        XLSX.utils.book_append_sheet(wb, wsEx, "Exercise Metrics");
      }

      // Summary sheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryCards.map(c => ({ Metric: c.label, Value: c.value })));
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      XLSX.writeFile(wb, "Recovery_Report.xlsx");
      toast.success("Excel Downloaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate Excel");
    }
  };

  // Parse report_data for expanded session view
  const getSessionDetails = (session: any) => {
    const rd = session.report_data;
    if (!rd) return null;
    return {
      overall: rd.overall || session.overall_score || 0,
      metrics: rd.metrics || [],
      findings: rd.findings || [],
      timestamp: new Date(session.finished_at).toLocaleString(),
    };
  };

  return (
    <div className="space-y-6" id="reports-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your recovery progress over time</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
          <Button onClick={handleExportExcel} variant="outline" className="border-blue-500/30 hover:bg-blue-500/10 transition-all font-bold group">
            <Table className="w-4 h-4 mr-2 text-blue-500 group-hover:scale-110 transition-transform" />
            Export Excel
          </Button>
          <Button onClick={handleExportPDF} className="bg-blue-600 text-white hover:bg-blue-700 transition-all font-bold shadow-glow group">
            <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Export PDF
          </Button>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-4 border border-border shadow-card hover:shadow-elevated transition-shadow">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="font-display text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Timeline */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Posture Score Timeline</h3>
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 25% 90%)" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(213, 85%, 45%)" radius={[4, 4, 0, 0]} name="Score %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
              <ScanEye className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-sm">No posture data yet</p>
            </div>
          )}
        </div>

        {/* Score Distribution */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-semibold text-foreground mb-4">Score Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
              <Target className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-sm">Complete scans to see distribution</p>
            </div>
          )}
        </div>
      </div>

      {/* Posture Session History with expandable View */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-semibold text-foreground">Posture Session History</h3>
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs font-bold border-blue-500/20 text-blue-500">
            {totalPostureSessions} Record{totalPostureSessions !== 1 ? 's' : ''}
          </Badge>
        </div>

        {!loading && postureHistory.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
            <ScanEye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No posture sessions found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Complete a posture analysis to see reports here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {postureHistory.map((session, idx) => {
              const isExpanded = expandedSession === idx;
              const details = isExpanded ? getSessionDetails(session) : null;
              const score = session.overall_score || 0;

              return (
                <motion.div
                  key={session.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isExpanded
                      ? 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                      : 'bg-card border-border hover:border-blue-500/20 hover:shadow-card'
                  }`}
                >
                  {/* Session Header Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => setExpandedSession(isExpanded ? null : idx)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        score >= 70 ? 'bg-emerald-500/10' : score >= 40 ? 'bg-amber-500/10' : 'bg-red-500/10'
                      }`}>
                        <Activity className={`w-5 h-5 ${
                          score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">Posture Analysis</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.finished_at).toLocaleDateString()}
                          <Clock className="w-3 h-3 ml-1" />
                          {new Date(session.finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-xl font-black font-display ${
                          score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-red-500'
                        }`}>{score}%</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 text-xs px-3 font-bold rounded-lg border ${
                          isExpanded
                            ? 'text-red-500 bg-red-500/10 border-red-500/10 hover:bg-red-500/20'
                            : 'text-blue-500 bg-blue-500/10 border-blue-500/10 hover:bg-blue-500/20'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedSession(isExpanded ? null : idx);
                        }}
                      >
                        {isExpanded ? 'Close' : 'View'}
                        {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="px-4 pb-5 space-y-5 border-t border-border/50"
                    >
                      {/* Score Header */}
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-4">
                          <div className={`text-3xl font-black font-display ${details.overall >= 70 ? 'text-emerald-500' : details.overall >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                            {details.overall}%
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Posture Report</p>
                            <p className="text-xs text-muted-foreground">{details.timestamp}</p>
                          </div>
                        </div>
                        <CheckCircle2 className={`w-8 h-8 ${details.overall >= 70 ? 'text-emerald-500' : details.overall >= 40 ? 'text-amber-500' : 'text-red-500'}`} />
                      </div>

                      {/* Metrics */}
                      {details.metrics.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Detailed Metrics</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {details.metrics.map((m: any, i: number) => (
                              <div key={i} className="flex flex-col bg-secondary/30 border border-border/30 rounded-xl p-3">
                                <div className="flex justify-between text-xs mb-1.5 font-semibold">
                                  <span className="text-muted-foreground">{m.name}</span>
                                  <span className={`font-bold ${m.score >= 80 ? 'text-emerald-500' : m.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{m.score}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${m.score >= 80 ? 'bg-emerald-500' : m.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${m.score}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Findings */}
                      {details.findings.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Findings & Recommendations</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {details.findings.map((f: any, i: number) => (
                              <div key={i} className="bg-secondary/30 border border-border/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  {f.score >= 80
                                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                  }
                                  <span className="font-bold text-sm text-foreground">{f.title}</span>
                                </div>
                                {f.details && f.details.length > 0 && (
                                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-3">
                                    {f.details.map((d: string, j: number) => <li key={j}>{d}</li>)}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {details.metrics.length === 0 && details.findings.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No detailed report data available for this session.</p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exercise History */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-semibold text-foreground">Exercise History</h3>
          <Badge variant="outline" className="text-xs font-bold border-emerald-500/20 text-emerald-500">
            {totalExerciseSessions} Record{totalExerciseSessions !== 1 ? 's' : ''}
          </Badge>
        </div>

        {exerciseMetrics.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed border-border">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No exercise data found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Complete an exercise session to see records here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exerciseMetrics.slice(0, 12).map((m: any, idx: number) => (
              <motion.div
                key={m.id || idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-xl bg-secondary/20 border border-border hover:border-emerald-500/20 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground capitalize">
                      {(m.metric_type || 'exercise').split('_').pop()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(m.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Value: <span className="font-bold text-foreground">{m.metric_value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
