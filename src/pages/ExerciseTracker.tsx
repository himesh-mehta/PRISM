import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Play, Pause, RotateCcw, Timer, Award, Activity, Sparkles, Eye, Ruler, Lightbulb, Shirt, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

/* ── Exercise data ──────────────────────────────────────────────────────── */
const EX_LABELS: Record<string, string> = {
  squats: "Squats", bicep_curls: "Bicep Curls", pushups: "Push-ups",
  neck_rotation: "Neck Rotation", neck_tilt: "Neck Tilt",
  shoulder_rolls: "Shoulder Rolls", shoulder_press: "Shoulder Press", lateral_raises: "Lateral Raises",
  mountain_pose: "Tadasana", warrior_i: "Warrior I", warrior_ii: "Warrior II",
  tree_pose: "Tree Pose", chair_pose: "Chair Pose", triangle_pose: "Triangle Pose",
};

const EX_COLORS: Record<string, string> = {
  squats: "from-blue-500 to-cyan-400", bicep_curls: "from-emerald-500 to-teal-400", pushups: "from-purple-500 to-indigo-400",
  neck_rotation: "from-orange-500 to-amber-400", neck_tilt: "from-cyan-500 to-blue-400",
  shoulder_rolls: "from-violet-500 to-purple-400", shoulder_press: "from-teal-500 to-emerald-400", lateral_raises: "from-amber-500 to-yellow-400",
  mountain_pose: "from-rose-500 to-pink-400", warrior_i: "from-rose-500 to-pink-400", warrior_ii: "from-rose-500 to-pink-400",
  tree_pose: "from-rose-500 to-pink-400", chair_pose: "from-rose-500 to-pink-400", triangle_pose: "from-rose-500 to-pink-400",
};

const YOGA_EXERCISES = new Set(["mountain_pose","warrior_i","warrior_ii","tree_pose","chair_pose","triangle_pose"]);

const CATEGORIES = [
  { id: "strength", label: "Strength", icon: "💪", color: "from-blue-600 to-indigo-500", exercises: [
    { id: "squats", label: "Squats" },
    { id: "bicep_curls", label: "Bicep Curls" },
    { id: "pushups", label: "Push-ups" },
  ]},
  { id: "neck", label: "Neck", icon: "🔄", color: "from-amber-500 to-orange-400", exercises: [
    { id: "neck_rotation", label: "Neck Rotation" },
    { id: "neck_tilt", label: "Neck Tilt" },
  ]},
  { id: "shoulder", label: "Shoulder", icon: "🦾", color: "from-violet-500 to-purple-400", exercises: [
    { id: "shoulder_rolls", label: "Shoulder Rolls" },
    { id: "shoulder_press", label: "Shoulder Press" },
    { id: "lateral_raises", label: "Lateral Raises" },
  ]},
  { id: "yoga", label: "Yoga", icon: "🧘", color: "from-rose-500 to-pink-400", exercises: [
    { id: "mountain_pose", label: "Tadasana" },
    { id: "warrior_i", label: "Warrior I" },
    { id: "warrior_ii", label: "Warrior II" },
    { id: "tree_pose", label: "Tree Pose" },
    { id: "chair_pose", label: "Chair Pose" },
    { id: "triangle_pose", label: "Triangle Pose" },
  ]},
];

const EX_ICONS: Record<string, string> = {
  squats: "🦵", bicep_curls: "💪", pushups: "🤸",
  neck_rotation: "🔄", neck_tilt: "↔️",
  shoulder_rolls: "🔃", shoulder_press: "⬆️", lateral_raises: "↕️",
  mountain_pose: "🏔", warrior_i: "⚔️", warrior_ii: "🗡️",
  tree_pose: "🌳", chair_pose: "🪑", triangle_pose: "📐"
};

const EX_GUIDES: Record<string, string[]> = {
  squats: ["Stand with feet shoulder-width apart","Keep chest up, back straight throughout","Lower until knees reach ~90° angle","Drive through heels to stand back up","Keep knees in line with toes — no caving in"],
  bicep_curls: ["Stand straight, arms fully extended at sides","Keep elbows fixed — do not let them drift forward","Curl weights up until angle is ~45°","Lower slowly — don't just drop your arms","Use a controlled medium speed (2s up, 2s down)"],
  pushups: ["Start in a high plank — body in a straight line","Hands slightly wider than shoulder-width","Lower chest to the floor — elbows ~45° from body","Push back up until arms are fully extended","Keep hips level — do not sag or pike"],
  neck_rotation: ["Stand or sit tall with shoulders relaxed","Slowly turn head to the LEFT — hold 1s","Return to centre, then rotate RIGHT — hold 1s","Keep shoulders completely still throughout","Medium speed only — never jerk or rush"],
  neck_tilt: ["Sit or stand tall, face forward","Slowly tilt right ear toward right shoulder","Return to centre, then tilt left ear to left shoulder","Keep both shoulders level and relaxed","Do NOT rotate your head — only tilt sideways"],
  shoulder_rolls: ["Stand tall with arms relaxed at sides","Roll both shoulders UP toward ears","Then roll them BACK and DOWN in a circle","Keep your neck relaxed throughout","Slow, controlled circles for full range"],
  shoulder_press: ["Stand with feet shoulder-width apart","Hold weights at shoulder height, elbows at ~90°","Press arms straight overhead until locked out","Lower slowly back to shoulder height","Keep core tight — no arching your lower back"],
  lateral_raises: ["Stand with arms at sides, slight elbow bend","Raise both arms out to sides simultaneously","Stop when wrists are at shoulder height (T-shape)","Lower slowly — don't let arms drop","No shrugging — keep shoulders down and level"],
  mountain_pose: ["Stand with feet together, weight evenly distributed","Arms hang naturally at sides, palms forward","Lengthen spine — imagine a string pulling your crown up","Relax shoulders down and back","Breathe deeply and hold for 30 seconds"],
  warrior_i: ["Step one foot forward into a wide lunge","Bend front knee to ~90° — knee over ankle","Back leg stays straight and strong","Raise both arms overhead, palms together","Square hips forward and hold for 30 seconds"],
  warrior_ii: ["Step feet wide apart — about 3-4 feet","Turn front foot 90°, back foot slightly in","Bend front knee to 90° over ankle","Extend arms out to sides at shoulder height","Gaze over front fingertips and hold for 30 seconds"],
  tree_pose: ["Stand on one leg, find your balance point","Place other foot on inner calf or inner thigh (not knee)","Bring hands to prayer at chest, or raise overhead","Keep standing hip level — engage your core","Fix your gaze on a still point and hold for 30 seconds"],
  chair_pose: ["Stand with feet hip-width apart","Bend knees and lower as if sitting in a chair","Aim for thighs parallel to the floor (~100°)","Raise arms overhead, parallel or palms together","Keep chest lifted, spine long — hold for 30 seconds"],
  triangle_pose: ["Stand with feet wide apart (3-4 feet)","Turn front foot out 90°, back foot slightly in","Keep both legs straight and strong","Reach front hand down toward ankle/shin/floor","Extend top arm straight up — gaze up to top hand, hold 30s"],
};

const tips = [
  { icon: Eye, title: "Full Body Visible", desc: "Keep your full body in frame at all times" },
  { icon: Ruler, title: "2-3ft Distance", desc: "Stand 2-3 ft from the camera for best tracking" },
  { icon: Lightbulb, title: "Good Lighting", desc: "Ensure your room is well-lit for accurate tracking" },
  { icon: Shirt, title: "Fitted Clothing", desc: "Wear fitted clothes for accurate reading" }
];

/* ── Audio alarm ────────────────────────────────────────────────────────── */
let audioCtx: AudioContext | null = null;
function playAlarm() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.2);
    gain.connect(audioCtx.destination);
    osc.connect(gain);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

export default function ExerciseTracker() {
  const [activeCat, setActiveCat] = useState("strength");
  const [currentEx, setCurrentEx] = useState("squats");
  const [cameraOn, setCameraOn] = useState(false);
  const [tracking, setTracking] = useState(false);

  // Stats
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(100);
  const [feedback, setFeedback] = useState("Select an exercise and click Start");
  const [stateBadge, setStateBadge] = useState<"ready"|"tracking"|"yoga"|"stopped">("ready");
  const [angle, setAngle] = useState("—");
  const [speed, setSpeed] = useState("—");
  const [speedColor, setSpeedColor] = useState("text-muted-foreground");
  const [avgTime, setAvgTime] = useState("—");
  const [statusTxt, setStatusTxt] = useState("—");
  const [statusColor, setStatusColor] = useState("text-muted-foreground");
  const [holdElapsed, setHoldElapsed] = useState(0);
  const [holdTarget, setHoldTarget] = useState(30);
  const [inPose, setInPose] = useState(false);
  const [yogaSets, setYogaSets] = useState(0);
  const [alarmActive, setAlarmActive] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const lastAlarmRef = useRef(0);
  const [camBtnText, setCamBtnText] = useState("Start Camera");
  const [camBtnDisabled, setCamBtnDisabled] = useState(false);
  const [videoKey, setVideoKey] = useState(0);

  const guides = EX_GUIDES[currentEx] || [];
  const isYogaEx = YOGA_EXERCISES.has(currentEx);

  useEffect(() => {
    if (cameraOn) startPolling();
    
    // Global ESC key listener to end full screen
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && tracking) {
        handleStopEx();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && tracking) {
        handleStopEx();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => { 
      if (pollRef.current) clearInterval(pollRef.current); 
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [cameraOn, tracking]);

  // Dedicated unmount cleanup to avoid race conditions with cameraOn state
  useEffect(() => {
    return () => {
      fetch("/api-exercise/stop_camera", { method: "POST" }).catch(() => {});
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch("/api-exercise/app_state");
        const d = await r.json();
        updateUI(d);
      } catch (e) {}
    }, 200);
  }

  function updateUI(d: any) {
    const s = d.stats || {};
    if (s.is_yoga) {
      setHoldElapsed(s.hold_elapsed || 0);
      setHoldTarget(s.hold_target || 30);
      setInPose(s.in_pose || false);
      setYogaSets(s.reps || 0);
      setAngle((s.hold_elapsed || 0).toFixed(1) + "s");
      setAvgTime((s.hold_target || 30) + "s");
      setStatusTxt(s.in_pose ? "✓ In Pose" : "✗ Not in Pose");
      setStatusColor(s.in_pose ? "text-emerald-400" : "text-red-400");
      setSpeed(s.in_pose ? "Holding" : "Get in pose");
      setSpeedColor(s.in_pose ? "text-amber-400" : "text-muted-foreground");
    } else {
      if (s.reps !== undefined) setRepCount(s.reps);
      setAngle(s.angle !== undefined ? `${s.angle}°` : "—");
      // Show live speed from backend (starts as 'Ready', updates as user moves)
      setSpeed(s.speed_msg !== undefined ? s.speed_msg : "Ready");
      setSpeedColor(s.speed_status === "good" ? "text-emerald-400" : s.speed_status === "too_fast" ? "text-red-400" : "text-amber-400");
      setAvgTime(s.avg_rep_time > 0 ? `${s.avg_rep_time}s` : "—");
      const statusMap: any = { good: "✓ Good", too_fast: "⚠ Too Fast", too_slow: "⚠ Too Slow" };
      setStatusTxt(statusMap[s.speed_status] || "—");
      setStatusColor(s.speed_status === "good" ? "text-emerald-400" : s.speed_status === "too_fast" ? "text-red-400" : "text-amber-400");
    }
    if (s.form_score !== undefined) setFormScore(s.form_score);
    if (s.feedback) setFeedback(s.feedback);

    if (tracking && !s.is_yoga && cameraOn) {
      if (s.speed_status === "too_fast" || (s.form_score !== undefined && s.form_score < 40)) {
        const now = Date.now();
        if (now - lastAlarmRef.current > 800) {
          playAlarm(); lastAlarmRef.current = now;
          setAlarmActive(true); setTimeout(() => setAlarmActive(false), 400);
        }
      }
    }
  }

  function selectEx(id: string) {
    if (tracking) return;
    setCurrentEx(id);
    setFeedback("Select an exercise and click Start");
  }

  async function handleStartCam() {
    setCamBtnDisabled(true); setCamBtnText("Starting...");
    try {
      const r = await fetch("/api-exercise/start_camera", { method: "POST" });
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      setVideoKey(Date.now()); setCameraOn(true);
    } catch (e: any) {
      alert("Camera error: " + e.message); setCamBtnDisabled(false); setCamBtnText("Start Camera");
    }
  }

  async function handleStartEx() {
    await fetch("/api-exercise/start_exercise", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exercise: currentEx }) });
    setTracking(true); setStateBadge(isYogaEx ? "yoga" : "tracking");
    // Mirror Posture AI: Request Native Fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  async function handleStopEx() {
    try {
      await fetch("/api-exercise/stop_exercise", { method: "POST" });
    } catch (e) {}

    // 💾 Save exercise session to Neon
    const savedUser = localStorage.getItem("prism_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.user_id && repCount > 0) {
        fetch(apiUrl("/api/exercise-report"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: u.user_id,
            exercise: currentEx,
            reps: repCount,
            formScore: formScore,
            duration: holdElapsed > 0 ? Math.round(holdElapsed) : repCount * 3
          })
        })
        .then(r => r.json())
        .then(() => console.log("✅ Exercise session saved to Neon"))
        .catch(err => console.error("Exercise save failed:", err));
      }
    }

    setTracking(false); setStateBadge("stopped");
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    await handleStopCam();
  }

  async function handleReset() {
    await fetch("/api-exercise/reset_exercise", { method: "POST" });
    setRepCount(0); setHoldElapsed(0); setYogaSets(0); setFormScore(100); setFeedback("Reset — ready to go again");
  }

  async function handleStopCam() {
    if (pollRef.current) clearInterval(pollRef.current);
    await fetch("/api-exercise/stop_camera", { method: "POST" });
    setCameraOn(false); setTracking(false); setStateBadge("ready");
    setCamBtnDisabled(false); setCamBtnText("Start Camera");
  }

  const filterCat = CATEGORIES.find(c => c.id === activeCat)!;

  return (
    <div className={`space-y-6 pb-12 transition-colors duration-300 ${alarmActive ? "bg-red-950/20" : ""}`}>
      
      {/* 1. Header Hero Panel */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] rounded-3xl p-6 text-white shadow-xl border border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.15),transparent_50%)]" />
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-300" />
            Exercise Tracker
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-lg">AI full-body skeleton evaluation using Mediapipe Pose Landmarks.</p>
        </div>
      </motion.div>

      {/* 2. Micro Tips Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tips.map((t, index) => (
          <motion.div key={t.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-card/40 backdrop-blur-xl rounded-2xl p-4 border border-border/60 shadow-sm flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary"> <t.icon className="w-4 h-4" /> </div>
            <div>
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">{t.title}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Category tabs */}
      <div className="flex bg-secondary/50 backdrop-blur-md p-1 rounded-2xl border border-border/60 max-w-fit gap-1">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { if (!tracking) setActiveCat(cat.id); }} disabled={tracking} className={`flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all ${activeCat === cat.id ? `bg-gradient-to-r ${cat.color} text-white shadow-md shadow-primary/20` : "text-muted-foreground hover:text-foreground cursor-pointer"}`}>
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* 4. Workout Select Grid */}
      <motion.div layout className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {filterCat.exercises.map(ex => {
          const isActive = currentEx === ex.id;
          const configGrad = EX_COLORS[ex.id] || "from-primary to-primary-foreground";
          return (
            <motion.button key={ex.id} onClick={() => selectEx(ex.id)} disabled={tracking} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} className={`relative backdrop-blur-xl rounded-2xl p-4 border border-border/60 flex flex-col items-center text-center gap-2 cursor-pointer group transition-all ${isActive ? "border-primary bg-primary/5 shadow-md shadow-primary/10" : "bg-card/40 hover:border-primary/40"}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${isActive ? `bg-gradient-to-br ${configGrad} text-white` : "bg-secondary group-hover:bg-primary/5"}`}>
                {EX_ICONS[ex.id]}
              </div>
              <p className={`font-black text-xs tracking-tight ${isActive ? "text-primary" : "text-foreground"}`}>{ex.label}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Launch Zone */}
      <div className="flex justify-center bg-card/60 backdrop-blur-xl p-6 rounded-3xl border border-border/60 shadow-xl mt-8">
         {!cameraOn ? (
            <Button size="lg" disabled={camBtnDisabled} className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl px-12 h-16 text-lg flex items-center gap-2 shadow-2xl shadow-primary/30" onClick={handleStartCam}> <Camera className="w-6 h-6" /> Start Session </Button>
         ) : (
            <div className="flex items-center gap-4">
               <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl px-12 h-16 text-lg flex items-center gap-2 shadow-2xl shadow-emerald-500/30" onClick={handleStartEx}> <Play className="w-5 h-5 fill-white" /> Start Exercise </Button>
               <Button size="icon" variant="outline" className="rounded-2xl w-16 h-16 border-2" onClick={handleStopCam}> <CameraOff className="w-6 h-6" /> </Button>
            </div>
         )}
      </div>

      {/* ── FOCUS MODAL OVERLAY (PORTAL TO BODY TO OVERRIDE ALL) ─────── */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {tracking && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100000] bg-[#0b1120] p-0 m-0 w-screen h-screen overflow-hidden flex flex-col lg:flex-row items-stretch"
            >
              {/* Top Close Button */}
              <motion.button 
                initial={{ y: -20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                onClick={handleStopEx}
                className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full border border-white/10 transition-all z-[101]"
                title="Close (Esc)"
              >
                <X className="w-6 h-6" />
              </motion.button>

              {/* Main Video View (Force Fill) */}
              <div className="relative flex-1 bg-black overflow-hidden h-full flex items-center justify-center">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`relative w-full h-full ${alarmActive ? "ring-inset ring-8 ring-red-500" : ""}`}
                >
                  <img src={`/api-exercise/video_feed?t=${videoKey}`} alt="Live Feed" className="w-full h-full object-cover" />
                  
                  {/* HUD Overlay Labels */}
                  <div className="absolute top-10 left-10 flex items-center gap-2 bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.2em]">AI ANALYSIS LIVE</span>
                  </div>

                  <div className="absolute bottom-10 right-10">
                    <Button onClick={handleStopEx} className="bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl px-10 py-5 flex items-center gap-2 shadow-2xl transition-transform active:scale-95">
                      <CameraOff className="w-5 h-5" /> STOP DETECTION
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Analysis Sidebar */}
              <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-full lg:w-[480px] h-full bg-[#0f172a] border-l border-white/5 p-16 flex flex-col gap-12 shadow-3xl z-20 overflow-y-auto premium-scrollbar"
              >
                  <div className="text-center space-y-2">
                    <h2 className="text-lg font-black text-white tracking-widest uppercase">Analysis</h2>
                    <div className="flex items-center justify-center gap-2 text-primary">
                      <Activity className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{EX_LABELS[currentEx]}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-10">
                    {/* Reps/Timer Hero */}
                    {!isYogaEx ? (
                      <div className="text-center py-6 bg-white/5 rounded-[40px] border border-white/5 shadow-inner">
                        <h3 className="text-9xl font-black text-white tracking-tighter">{repCount}</h3>
                        <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">Current Reps</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6 bg-white/5 rounded-[40px] border border-white/5 shadow-inner">
                        <div className="text-5xl font-black text-white">{Math.floor(holdElapsed)}s</div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Hold Time</p>
                      </div>
                    )}

                    {/* Info List Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5">
                        <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Form Accuracy</span>
                        <span className={`text-sm font-black ${formScore > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{formScore}%</span>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5">
                        <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Movement Speed</span>
                        <span className={`text-sm font-black ${speedColor}`}>{speed}</span>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5">
                        <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Current Angle</span>
                        <span className="text-sm font-black text-white">{angle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Feedback Bar */}
                  <motion.div 
                    animate={{ backgroundColor: alarmActive ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)" }}
                    className="p-6 rounded-3xl border border-white/5 text-center mt-auto"
                  >
                    <p className="text-[13px] font-bold text-white/90 leading-relaxed italic">"{feedback}"</p>
                  </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
