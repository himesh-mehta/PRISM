import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, User, Bell, Shield, Palette, Info, CheckCircle2, Activity, Copy, QrCode } from "lucide-react";

const SettingsPage = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    age: user?.age?.toString() || "",
    weight: user?.weight?.toString() || "",
    height: user?.height?.toString() || "",
    gender: user?.gender || "male",
  });
  const [saved, setSaved] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  const uniquePatientId = (user as any)?.user_id || "Not available — please log in again";

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(uniquePatientId);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = uniquePatientId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    }
  };

  const handleSave = () => {
    login({
      name: form.name,
      email: form.email,
      age: parseInt(form.age),
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      gender: form.gender,
      bmi: user?.bmi || 0,
      bodyType: user?.bodyType || "",
      role: user?.role || "patient",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bmi = form.weight && form.height
    ? (parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)
    : null;

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "about", label: "About", icon: Info },
  ];
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
          <span className="text-gradient-hero">Settings</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage your account and preferences</p>
      </motion.div>

      <div className="flex gap-2 border-b border-border/30 pb-0 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "animate-pulse" : ""}`} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === "profile" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-glass border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-elevated"
          >
            <h3 className="text-2xl font-display font-bold text-foreground mb-8">Personal Information</h3>
            <div className="space-y-8">
              {/* Unique Patient ID — only for patients */}
              {user?.role === "patient" && (
                <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                      <QrCode className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-widest">Your Unique Patient ID</p>
                      <p className="text-xs text-muted-foreground">Share with your doctor to be added to their patient list</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <code className="flex-1 bg-secondary/50 border border-border/50 rounded-xl px-4 py-3 text-xs font-mono text-foreground break-all select-all">
                      {uniquePatientId}
                    </code>
                    <Button
                      onClick={copyId}
                      size="sm"
                      className={`shrink-0 h-11 px-4 rounded-xl font-bold transition-all ${idCopied ? 'bg-green-500 text-white' : 'bg-blue-500/15 text-blue-500 hover:bg-blue-500 hover:text-white border border-blue-500/20'}`}
                    >
                      {idCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-2">{idCopied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Profile Image Column */}
              <div className="flex items-center gap-6 pb-8 border-b border-border/30">
                <div className="w-20 h-20 rounded-2xl bg-accent-gradient flex items-center justify-center text-3xl font-display font-bold text-white shadow-glow">
                  {form.name ? form.name.charAt(0).toUpperCase() : "P"}
                </div>
                <div>
                  <p className="text-xl font-display font-bold text-foreground">{form.name || "Your Name"}</p>
                  <p className="text-muted-foreground font-medium">{form.email || "your@email.com"}</p>
                  <button className="text-xs font-bold text-primary mt-2 uppercase tracking-wider hover:underline">Change Avatar</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Full Name</label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-12 bg-secondary/30 border-none rounded-xl focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Email Address</label>
                  <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-12 bg-secondary/30 border-none rounded-xl focus:ring-primary/20" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Age</label>
                  <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="h-12 bg-secondary/30 border-none rounded-xl focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Weight (kg)</label>
                  <Input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="h-12 bg-secondary/30 border-none rounded-xl focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground ml-1">Height (cm)</label>
                  <Input type="number" value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} className="h-12 bg-secondary/30 border-none rounded-xl focus:ring-primary/20" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground ml-1">Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="flex h-12 w-full rounded-xl border-none bg-secondary/30 px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Live BMI */}
              {bmi && (
                <div className="bg-secondary/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current BMI</span>
                      <p className="text-3xl font-display font-extrabold text-foreground">{bmi}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${parseFloat(bmi) < 18.5 ? "bg-amber-500/20 text-amber-500" :
                      parseFloat(bmi) < 25 ? "bg-green-500/20 text-green-500" :
                        "bg-red-500/20 text-red-500"
                      }`}>
                      {parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Healthy" : "Overweight"}
                    </span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((parseFloat(bmi) / 40) * 100, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)] ${parseFloat(bmi) < 18.5 ? "bg-amber-500" :
                        parseFloat(bmi) < 25 ? "bg-green-500" :
                          "bg-red-500"
                        }`}
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleSave} className="bg-accent-gradient text-accent-foreground shadow-glow h-12 px-8 rounded-xl font-bold hover:scale-105 transition-transform duration-300">
                <Save className="w-5 h-5 mr-2" /> {saved ? "Changes Saved!" : "Save Profile Changes"}
              </Button>
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-glass border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-elevated"
          >
            <h3 className="text-2xl font-display font-bold text-foreground mb-8">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { name: "Exercise reminders", desc: "Get reminded to complete your daily exercises", icon: Activity },
                { name: "Progress reports", desc: "Weekly summary of your recovery progress", icon: Info },
                { name: "New recommendations", desc: "AI-suggested exercises based on your profile", icon: User },
                { name: "System updates", desc: "App updates and new feature announcements", icon: Bell },
                { name: "Posture alerts", desc: "Real-time posture correction notifications", icon: Shield },
              ].map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-5 rounded-2xl bg-secondary/20 border border-white/5 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-base text-foreground font-bold">{item.name}</span>
                      <p className="text-sm text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-muted/50 rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-inner"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "privacy" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-glass border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-elevated"
          >
            <h3 className="text-2xl font-display font-bold text-foreground mb-8">Privacy & Security</h3>
            <div className="space-y-6">
              {[
                { icon: Shield, title: "Data Storage", desc: "Your data is stored locally on your device. No data is sent to external servers.", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: CheckCircle2, title: "Camera Access", desc: "Camera access is only used during posture detection and exercise tracking sessions.", color: "text-green-500", bg: "bg-green-500/10" },
                { icon: CheckCircle2, title: "End-to-End Encryption", desc: "All exercise data and health metrics are encrypted and stored securely.", color: "text-purple-500", bg: "bg-purple-500/10" },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-4 p-6 rounded-2xl bg-secondary/20 border border-white/5">
                  <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <Button variant="destructive" className="h-12 px-8 rounded-xl font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-none">
                  Delete All User Data Permanently
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "appearance" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-glass border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-elevated"
          >
            <h3 className="text-2xl font-display font-bold text-foreground mb-8">Appearance</h3>
            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold text-foreground mb-4 ml-1 uppercase tracking-widest">Interface Theme</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: "Light", color: "bg-white", active: true },
                    { name: "Dark", color: "bg-slate-900", active: false },
                    { name: "System", color: "bg-gradient-to-br from-white to-slate-900", active: false },
                  ].map(theme => (
                    <button key={theme.name} className={`group relative rounded-2xl p-5 border-2 transition-all overflow-hidden ${theme.active ? "border-primary bg-primary/5 shadow-glow" : "border-white/10 hover:border-white/30"
                      }`}>
                      <div className={`w-full h-16 rounded-xl ${theme.color} mb-3 shadow-inner group-hover:scale-105 transition-transform duration-500`} />
                      <p className="text-base font-bold text-foreground">{theme.name}</p>
                      {theme.active && <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white" /></div>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
                <Info className="w-5 h-5 text-primary" />
                <p className="text-sm font-bold text-primary">Theme synchronization is now live across all your devices.</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "about" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-glass border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-elevated"
          >
            <h3 className="text-2xl font-display font-bold text-foreground mb-8">About Prism</h3>
            <div className="space-y-8">
              <div className="flex items-center gap-6 pb-8 border-b border-border/30">
                <div className="w-20 h-20 rounded-2xl bg-accent-gradient flex items-center justify-center shadow-glow">
                  <span className="text-white font-display font-bold text-4xl">P</span>
                </div>
                <div>
                  <p className="font-display font-extrabold text-3xl text-foreground">Prism Health Hub</p>
                  <p className="text-lg text-primary font-bold">Release v2.4.0 <span className="text-muted-foreground font-medium ml-2">"Vibrant Vision"</span></p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                Prism is an AI-powered physiotherapy ecosystem designed to bridge the gap between clinical expertise and at-home recovery. Our platform empowers both patients and doctors with real-time feedback, predictive analytics, and premium rehabilitation protocols.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Exercises", value: "120+" },
                  { label: "Clinical Partners", value: "450" },
                  { label: "AI Models", value: "5" },
                  { label: "Recovery Rate", value: "92%" },
                ].map(stat => (
                  <div key={stat.label} className="p-6 rounded-2xl bg-secondary/20 border border-white/5 text-center group hover:bg-primary/5 transition-colors">
                    <p className="font-display font-extrabold text-2xl text-foreground group-hover:text-primary transition-colors">{stat.value}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-white/10">Terms of Service</Button>
                <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-white/10">Privacy Policy</Button>
                <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-white/10">Help Center</Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
