import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Play, AlertTriangle, CheckCircle2, Clock, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import FuturisticVideo from "@/assets/Futuristic_Posture_Detection_Video.mp4";
import { apiUrl } from "@/lib/api";

const VIEW_INSTRUCTIONS: Record<string, string[]> = {
  FRONT: ['Stand FACING the camera', 'Arms relaxed at sides', 'Feet shoulder-width apart'],
  RIGHT: ['Turn RIGHT side to camera', 'Look straight ahead', 'Stand tall'],
  BACK: ['Turn BACK to camera', 'Arms relaxed at sides', 'Feet shoulder-width apart'],
  LEFT: ['Turn LEFT side to camera', 'Look straight ahead', 'Stand tall']
};

const PostureDetection = () => {
  const [isActive, setIsActive] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [backendState, setBackendState] = useState<string>("idle");
  const [viewInfo, setViewInfo] = useState<any>(null);
  const [completedViews, setCompletedViews] = useState<string[]>([]);
  const [prepRem, setPrepRem] = useState(0);
  const [capRem, setCapRem] = useState(0);
  const [capProg, setCapProg] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [allViewsDone, setAllViewsDone] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval>>();
  const navigate = useNavigate();

  // 📦 Load posture history from Neon DB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedUser = localStorage.getItem("prism_user");
        if (!savedUser) return;
        const u = JSON.parse(savedUser);
        if (!u.patient_id) return;

        const res = await fetch(apiUrl(`/api/posture-history?patientId=${u.patient_id}`));
        const data = await res.json();
        if (data.success && data.sessions?.length > 0) {
          const dbRecords = data.sessions.map((s: any) => {
            // If report_data is stored, parse it for metrics/findings
            let parsed: any = {};
            if (s.report_data) {
              try { parsed = typeof s.report_data === 'string' ? JSON.parse(s.report_data) : s.report_data; } catch {}
            }
            return {
              overall: s.overall_score || parsed.overall || 0,
              metrics: parsed.metrics || [],
              findings: parsed.findings || [],
              timestamp: new Date(s.finished_at).toLocaleString(),
              sessionId: s.id,
            };
          });
          setReportsHistory(dbRecords);
        }
      } catch (err) {
        console.error("Failed to load posture history:", err);
      }
    };
    loadHistory();
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const r = await fetch('/api-posture/app_state');
        const d = await r.json();
        setBackendState(d.state);
        setViewInfo(d.view);
        setCompletedViews(d.completed || []);
        setPrepRem(d.prep_rem || 0);
        setCapRem(d.cap_rem || 0);
        setCapProg(d.cap_prog || 0);
        setIsPaused(d.paused || false);
        
        if (d.results) {
          setResults(d.results);
        }

        if (d.state === 'done') {
          fetchResults();
          setAllViewsDone(true);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        }
      } catch (e) { }
    }, 500);
  }, []);

  const fetchResults = async () => {
    try {
      const r = await fetch('/api-posture/results');
      const d = await r.json();
      if (d.ok) {
        setResults(d.data);
        setReportsHistory((prev) => [{ ...d.data, timestamp: new Date().toLocaleTimeString() }, ...prev]);
        setShowReport(true);

        // 💾 Save to Neon DB
        const savedUser = localStorage.getItem("prism_user");
        if (savedUser) {
          const u = JSON.parse(savedUser);
          if (u.user_id || u.patient_id) {
            fetch(apiUrl("/api/posture-report"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: u.user_id,
                patientId: u.patient_id,
                results: d.data
              })
            })
            .then(r => r.json())
            .then(res => console.log("✅ Posture report saved:", res))
            .catch(err => console.error("Posture save failed:", err));
          } else {
            console.warn("⚠️ No user_id/patient_id in localStorage — log out and log back in");
          }
        }
      }
    } catch (e) { }
  };

  const startAnalysis = useCallback(async () => {
    try {
      const r = await fetch('/api-posture/start_analysis', { method: 'POST' });
      const d = await r.json();
      if (!d.ok) {
        alert("Could not start analysis: " + d.message);
      }
    } catch (e) { }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const r = await fetch('/api-posture/start_camera', { method: 'POST' });
      const d = await r.json();
      if (d.ok) {
        setIsActive(true);
        setIsFocusMode(true);
        setResults(null);
        setShowReport(false);
        setAllViewsDone(false);
        setVideoUrl(`/api-posture/video_feed?t=${Date.now()}`);
        startPolling();
        
        // Skip overlay and immediately trigger analysis
        setTimeout(() => {
          startAnalysis();
        }, 1500);

        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        alert("Backend camera failure: " + d.message);
      }
    } catch (e) {
      alert("Make sure the posture detection backend is running.");
    }
  }, [startPolling, startAnalysis]);

  const stopCamera = useCallback(async () => {
    try {
      await fetch('/api-posture/stop_camera', { method: 'POST' });
    } catch (e) { }
    setIsActive(false);
    setIsFocusMode(false);
    setBackendState("idle");
    setVideoUrl("");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  const togglePause = useCallback(async () => {
    try {
      const r = await fetch('/api-posture/pause_toggle', { method: 'POST' });
      if (!r.ok) throw new Error("Server responded with " + r.status);
      const d = await r.json();
      toast.success(d.paused ? "Paused" : "Resumed");
    } catch (e: any) { 
      toast.error("Pause fail: " + e.message);
    }
  }, []);

  const resetAnalysis = useCallback(async () => {
    try {
      await fetch('/api-posture/reset', { method: 'POST' });
      setResults(null);
      setShowReport(false);
      startPolling(); // resume polling for camera state
    } catch (e) { }
  }, [startPolling]);

  // Dedicated unmount cleanup to avoid race conditions
  useEffect(() => {
    return () => { 
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      // Ensure camera is released ONLY on unmount
      stopCamera();
    };
  }, []);

  // Keyboard shortcut listener for spacebar to toggle Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isActive) {
        e.preventDefault();
        if (backendState === 'prep' || backendState === 'capturing') {
          togglePause();
        } else {
          toast.info("Spacebar ignored: State is " + backendState);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, backendState, togglePause]);

  // Auto-stop camera and exit fullscreen when all views are done
  useEffect(() => {
    if (allViewsDone && isActive) {
      stopCamera();
      toast.success("All views captured! Check your report below.", { duration: 4000 });
    }
  }, [allViewsDone]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFocusMode) {
        stopCamera();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFocusMode, stopCamera]);

  return (
    <div className={`${isFocusMode ? "" : "space-y-6"} ${isFocusMode ? "fixed inset-0 z-[100] bg-[#0b1120] p-4 m-0 flex flex-col h-screen overflow-hidden" : ""}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={isFocusMode ? "hidden" : ""}>
        <h1 className="font-display text-3xl font-bold text-foreground">Posture Detection</h1>
        <p className="text-muted-foreground mt-1">Use your webcam to analyze your posture in real-time</p>
      </motion.div>

      <div className={`grid grid-cols-1 ${isFocusMode ? "lg:grid-cols-4 gap-4" : "lg:grid-cols-3 gap-6"} ${isFocusMode ? "flex-1 min-h-0" : ""}`}>
        {/* Camera view */}
        <div className={`${isFocusMode ? "lg:col-span-3 h-full flex flex-col justify-center" : "lg:col-span-2"}`}>
          <div className={`${isFocusMode ? "flex-1 flex flex-col h-full justify-center" : "bg-card rounded-2xl border border-border shadow-card overflow-hidden"}`}>
            <div className={`relative bg-prism-navy flex items-center justify-center rounded-2xl overflow-hidden border border-border ${isFocusMode ? "aspect-video max-h-[86vh] w-full self-center" : "relative aspect-video flex items-center justify-center"}`}>
              
              {/* Stop / See Reports Buttons */}
              {isFocusMode && (
                <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                  {allViewsDone && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow-lg px-4 py-1.5"
                      onClick={() => { stopCamera(); navigate('/dashboard/reports'); }}
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> See Reports
                    </Button>
                  )}
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow-md px-3 py-1.5" onClick={stopCamera}>
                    <CameraOff className="w-3.5 h-3.5" /> Stop Detection
                  </Button>
                </div>
              )}



              {/* Countdown Overlay (Prep mode) */}
              {backendState === 'prep' && prepRem > 0 && viewInfo && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="flex flex-col items-center">
                     <h5 className="text-xs uppercase tracking-[0.25em] font-black text-blue-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] mb-3">{viewInfo.id} VIEW</h5>
                     
                     <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-white/5 backdrop-blur-lg border border-white/10 shadow-glow mb-6">
                       <svg className="absolute inset-0 w-full h-full -rotate-90">
                         <circle cx="56" cy="56" r="50" className="stroke-white/5" strokeWidth="4" fill="transparent" />
                         <motion.circle cx="56" cy="56" r="50" className="stroke-blue-400" strokeWidth="4" strokeLinecap="round" fill="transparent" strokeDasharray="314.16" strokeDashoffset={314.16 * (1 - prepRem / 3)} transition={{ type: "tween", ease: "linear", duration: 0.4 }} />
                       </svg>
                       <motion.span key={Math.ceil(prepRem)} initial={{ scale: 1.25, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="absolute text-white text-5xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{Math.ceil(prepRem)}</motion.span>
                     </div>
                     
                     {VIEW_INSTRUCTIONS[viewInfo.id] && (
                       <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 max-w-sm text-center shadow-lg mx-4">
                         {VIEW_INSTRUCTIONS[viewInfo.id].map((l, i) => (
                            <p key={i} className="text-white/80 text-xs font-medium leading-relaxed mb-1 last:mb-0">✓ {l}</p>
                         ))}
                       </div>
                     )}
                   </div>
                </div>
              )}



              {/* Pause Blur Overlay */}
              {isPaused && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md">
                   <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                     <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 border border-white/20 cursor-pointer" onClick={togglePause}>
                        <Play className="w-8 h-8 text-white animate-pulse" />
                     </div>
                     <p className="text-white text-3xl font-black font-display">Paused</p>
                     <p className="text-white/60 text-xs mt-1">Press Spacebar or Click Icon to Resume</p>
                   </motion.div>
                </div>
              )}

              {/* Video Stream --> Actually an Image stream */}
              {isActive && videoUrl ? (
                <img src={videoUrl} alt="webcam" className="w-full h-full object-cover" />
              ) : (
                <div className="hidden" />
              )}
              
              {!isActive && (
                <div className="text-center z-10 px-4">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                     <Camera className="w-10 h-10 text-white/40" />
                  </div>
                  <p className="text-white text-lg font-display font-bold">Posture AI Analysis</p>
                  <p className="text-white/60 text-xs mt-1 mb-4">Click Start to enable your camera for real-time analysis</p>
                  <Button onClick={startCamera} size="lg" className="bg-accent-gradient hover:opacity-90 text-white shadow-glow rounded-2xl px-6 active:scale-95 transition-all text-sm font-bold flex items-center mx-auto">
                    <Camera className="w-4 h-4 mr-2" /> Start Detection
                  </Button>
                </div>
              )}

              {backendState === 'capturing' && (
                <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white text-sm font-bold flex items-center gap-2.5 shadow-lg">
                  <div className="relative flex h-2 w-2">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <div className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_#4ade80]" />
                  </div>
                  Analyzing...
                </div>
              )}


            </div>
            

          </div>
        </div>

        {/* Feedback panel */}
        <div className={isFocusMode ? "flex flex-col gap-3 h-full overflow-hidden justify-center" : "relative h-full"}>
          <div className={isFocusMode ? "flex flex-col gap-3" : "absolute inset-0 flex flex-col space-y-4 overflow-y-auto premium-scrollbar"}>
          {isFocusMode && isActive ? (
            <>
              <div className={`${isFocusMode ? "bg-white/5 backdrop-blur-md border-white/10 text-white shadow-[0_0_30px_-5px_rgba(56,189,248,0.15)]" : "bg-card border-border shadow-card h-full"} rounded-2xl border w-full flex flex-col p-5`}>
            <h3 className={`font-display font-bold text-center border-b border-border pb-2 mb-2.5 ${isFocusMode ? "text-base text-white" : "text-lg text-foreground"}`}>Posture Analysis</h3>
                <div className="flex flex-col w-full">
                <div className="flex items-center justify-center mb-2.5">
                  <span className={`text-xs font-black tracking-wider uppercase flex items-center gap-1.5 ${isFocusMode ? "text-blue-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" : "text-blue-500"}`}>
                    <Clock className={`w-3.5 h-3.5 ${isFocusMode ? "text-blue-400 animate-pulse" : "text-blue-500"}`} /> Live Progress
                  </span>
                </div>
                
                <div className="flex flex-col gap-2.5 w-full mt-1">
                  {['FRONT', 'RIGHT', 'BACK', 'LEFT'].map((v) => {
                    const isDone = completedViews.includes(v);
                    const isLive = viewInfo?.id === v;
                    return (
                      <div key={v} className={`flex items-center justify-between text-sm py-3 px-4 rounded-xl border w-full transition-all duration-300 cursor-default ${
                        isDone ? (isFocusMode ? "bg-green-500/20 border-green-500/20" : "bg-green-500/10 border-green-500/20")
                        : isLive ? (isFocusMode ? "bg-white/10 border border-white/10 border-l-4 border-l-red-500 shadow-md translate-x-1" : "bg-secondary/70 border border-border/40 border-l-4 border-l-red-500 shadow-md translate-x-1")
                        : (isFocusMode ? "bg-white/5 border-white/10" : "bg-secondary/40 border-border/30")
                      }`}>
                        <span className={`font-medium text-[13px] ${isDone ? (isFocusMode ? "text-green-400" : "text-green-600") : isLive ? (isFocusMode ? "text-white" : "text-foreground") : (isFocusMode ? "text-white/60" : "text-muted-foreground")}`}>{v.charAt(0) + v.slice(1).toLowerCase()} View</span>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          {isDone ? (
                            <span className={`${isFocusMode ? "text-green-400" : "text-green-600"} flex items-center gap-1`}><CheckCircle2 className="w-4 h-4" /> Done</span>
                          ) : isLive ? (
                            <span className="text-red-500 flex items-center gap-1">
                               <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                               Live
                            </span>
                          ) : (
                            <span className={isFocusMode ? "text-white/40" : "text-muted-foreground/60"}>Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>

          </>
          ) : (
            <>
              <div className={`${isFocusMode ? "bg-white/5 backdrop-blur-md border-white/10 text-white shadow-[0_0_30px_-5px_rgba(56,189,248,0.15)]" : "bg-card border-border shadow-card h-full"} rounded-2xl border w-full flex flex-col p-5`}>
            <h3 className={`font-display font-bold text-center border-b border-border pb-2 mb-2.5 ${isFocusMode ? "text-base text-white" : "text-lg text-foreground"}`}>Posture Analysis</h3>
                <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded-xl h-full mt-0">
                   <video 
                     src={FuturisticVideo} 
                     autoPlay 
                     loop 
                     muted 
                     playsInline 
                     className="absolute inset-0 w-full h-full object-cover rounded-xl"
                   />
                </div>
          </div>

          </>
          )}
          </div>
        </div>
      </div>

      {/* Detection History */}
      {!isFocusMode && (
        <div className="bg-card border border-border shadow-card rounded-2xl p-6 mt-6 w-full">
           <h4 className="text-xl font-bold font-display text-foreground mb-4 border-b border-border pb-3">History</h4>
           {reportsHistory.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                 {reportsHistory.map((r: any, i: number) => {
                   const isSelected = results === r && showReport;
                   return (
                    <div key={i} 
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.08)] hover:-translate-y-1 cursor-pointer ${
                        isSelected 
                          ? "bg-blue-500/10 border-blue-500/30 ring-2 ring-blue-500/20 dark:bg-blue-900/20" 
                          : "bg-zinc-50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-900 border-border/50"
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setResults(null);
                          setShowReport(false);
                        } else {
                          setResults(r);
                          setShowReport(true);
                        }
                      }}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${r.overall >= 70 ? "bg-emerald-500" : r.overall >= 40 ? "bg-amber-500" : "bg-red-500"}`} />
                          <div>
                             <p className="font-bold text-sm text-foreground">{r.overall}% <span className="text-[11px] font-normal text-muted-foreground ml-1">Overall</span></p>
                             <p className="text-[10px] text-muted-foreground mt-0.5">{r.timestamp}</p>
                          </div>
                       </div>
                       <Button 
                         variant="ghost" size="sm" 
                         className={`h-7 text-[10px] px-2.5 font-bold rounded-lg border ${
                           isSelected 
                             ? "text-red-500 bg-red-500/10 hover:bg-red-500/20 border-red-500/10 hover:text-red-600" 
                             : "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/10 hover:text-blue-600"
                         }`}
                         onClick={(e) => {
                           e.stopPropagation();
                           if (isSelected) {
                             setResults(null);
                             setShowReport(false);
                           } else {
                             setResults(r);
                             setShowReport(true);
                           }
                         }}
                       >{isSelected ? "Close" : "View"}</Button>
                    </div>
                   );
                 })}
                </div>

                {/* Expanded detail view for selected record */}
                {results && showReport && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border pt-6 mt-2 space-y-6"
                  >
                    {/* Score + Timestamp Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl font-black font-display ${results.overall >= 70 ? "text-emerald-500" : results.overall >= 40 ? "text-amber-500" : "text-red-500"}`}>
                          {results.overall}%
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">Posture Analysis Report</p>
                          <p className="text-xs text-muted-foreground">{results.timestamp}</p>
                        </div>
                      </div>
                      <CheckCircle2 className={`w-10 h-10 ${results.overall >= 70 ? "text-emerald-500" : results.overall >= 40 ? "text-amber-500" : "text-red-500"}`} />
                    </div>

                    {/* Metrics Grid */}
                    {results.metrics && results.metrics.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Detailed Metrics</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {results.metrics.map((m: any, i: number) => (
                            <div key={i} className="flex flex-col bg-zinc-50 dark:bg-zinc-900/40 border border-border/50 rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(56,189,248,0.12)] hover:bg-white dark:hover:bg-zinc-900">
                              <div className="flex justify-between text-xs mb-2 font-semibold">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  {m.name} 
                                  {m.view && <span className="text-[10px] text-zinc-400 font-normal">({m.view})</span>}
                                </span>
                                <span className={`font-bold ${m.score >= 80 ? "text-emerald-500" : m.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{m.score}%</span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${m.score >= 80 ? "bg-emerald-500" : m.score >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${m.score}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Findings & Recommendations */}
                    {results.findings && results.findings.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold uppercase text-muted-foreground mb-3 tracking-wider">Findings & Recommendations</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.findings.map((item: any, i: number) => (
                            <div key={i} className="bg-zinc-50 dark:bg-zinc-900/40 border border-border/50 shadow-sm rounded-xl p-5 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(56,189,248,0.12)] hover:bg-white dark:hover:bg-zinc-900">
                              <div className="flex items-center gap-2 mb-2.5">
                                {item.score >= 80 ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                <span className="font-bold text-sm text-foreground">{item.title}</span>
                              </div>
                              {item.details && item.details.length > 0 && (
                                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1.5 pl-3">
                                  {item.details.map((d: string, j: number) => <li key={j} className="leading-relaxed">{d}</li>)}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
           ) : (
              <div className="text-center py-14 text-muted-foreground text-sm flex flex-col items-center gap-2 justify-center">
                 <Clock className="w-8 h-8 opacity-40 animate-pulse text-blue-500 mb-1" />
                 No previous records found. Start a detection session to get insights!
              </div>
           )}
        </div>
      )}
    </div>
  );
};
export default PostureDetection;
