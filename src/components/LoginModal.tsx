import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, UserPlus, User, Mail, Ruler, Weight, Calendar, Users, Briefcase, Stethoscope } from "lucide-react";
import { apiUrl } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

type Role = "patient" | "doctor";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: "login" | "signup";
}

const LoginModal = ({ isOpen, onClose, initialTab = "login" }: LoginModalProps) => {
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab as any);

    // Sync activeTab with initialTab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab as any);
        }
    }, [isOpen, initialTab]);

    // Login State
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [loginLoading, setLoginLoading] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Signup State
    const [signupStep, setSignupStep] = useState<1 | 2>(1);
    const [role, setRole] = useState<Role>("patient");
    const [signupForm, setSignupForm] = useState({
        name: "",
        email: "",
        password: "",
        age: "",
        weight: "",
        height: "",
        gender: "male",
        credentials: "",
        specialization: "",
    });

    const bmi = signupForm.weight && signupForm.height
        ? (parseFloat(signupForm.weight) / Math.pow(parseFloat(signupForm.height) / 100, 2)).toFixed(1)
        : null;

    const bodyType = bmi
        ? parseFloat(bmi) < 18.5 ? "Underweight"
            : parseFloat(bmi) < 25 ? "Normal" : parseFloat(bmi) < 30 ? "Overweight" : "Obese"
        : null;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginForm.email || !loginForm.password) return;
        setLoginLoading(true);
        setError(null);

        try {
            const response = await fetch(apiUrl("/api/login"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
            });
            const data = await response.json();

            if (data.success && data.user) {
                login(data.user as any);
                setLoginLoading(false);
                onClose();
                navigate(data.user.role === "doctor" ? "/doctor/dashboard" : "/dashboard");
            } else {
                setError(data.error || "Login failed. Please check your credentials.");
                setLoginLoading(false);
            }
        } catch (err) {
            setError("Cannot connect to server. Make sure the backend is running.");
            setLoginLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (signupStep === 1) {
            if (!signupForm.name || !signupForm.email || !signupForm.password) return;
            setSignupStep(2);
            return;
        }

        if (role === "patient" && (!signupForm.age || !signupForm.weight || !signupForm.height)) return;
        if (role === "doctor" && (!signupForm.age || !signupForm.credentials || !signupForm.specialization)) return;

        setSignupLoading(true);
        
        const profileData = {
            name: signupForm.name,
            email: signupForm.email,
            age: parseInt(signupForm.age),
            weight: parseFloat(signupForm.weight) || 0,
            height: parseFloat(signupForm.height) || 0,
            gender: signupForm.gender,
            role: role,
            password: signupForm.password,
            credentials: signupForm.credentials || "",
            specialization: signupForm.specialization || ""
        };

        await signup(profileData as any);
        setSignupLoading(false);
        onClose();
        if (role === "doctor") {
            navigate("/doctor/dashboard");
        } else {
            navigate("/dashboard");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-prism-navy/95 backdrop-blur-xl border border-white/20 p-0 overflow-hidden shadow-2xl rounded-[2rem]">
                <div className="relative overflow-hidden">
                    {/* Background Decorative Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                x: [0, 30, 0],
                                y: [0, 20, 0],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-prism-blue/20 blur-[60px] rounded-full"
                        />
                        <motion.div
                            animate={{
                                x: [0, -30, 0],
                                y: [0, 40, 0],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-[5%] -right-[5%] w-[45%] h-[45%] bg-prism-indigo/20 blur-[60px] rounded-full"
                        />
                    </div>

                    <div className="px-8 pt-8 pb-4 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 mb-4 group justify-center">
                            <div className="w-10 h-10 rounded-xl bg-accent-gradient flex items-center justify-center shadow-glow">
                                <span className="text-white font-display font-bold text-xl">P</span>
                            </div>
                            <span className="font-display font-bold text-2xl text-white tracking-tight">Prism</span>
                        </div>
                        <DialogTitle className="font-display text-3xl font-bold text-white mb-2">
                            {activeTab === "login" ? "Welcome Back" : "Join Prism"}
                        </DialogTitle>
                        <DialogDescription className="text-white/60 text-base">
                            {activeTab === "login"
                                ? "Your personalized recovery companion"
                                : "Start your journey to better health today"}
                        </DialogDescription>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => {
                            setActiveTab(v as "login" | "signup");
                            if (v === "signup") {
                                setSignupStep(1); // Reset signup step when switching to signup tab
                            }
                        }}
                        className="w-full relative z-10"
                    >
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 p-2 h-14 gap-2 border-b border-white/10 rounded-none">
                            <TabsTrigger
                                value="login"
                                className="rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-medium"
                            >
                                Sign In
                            </TabsTrigger>
                            <TabsTrigger
                                value="signup"
                                className="rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-medium"
                            >
                                Join Now
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="p-6 m-0 outline-none">
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                        <Mail className="w-3.5 h-3.5 text-prism-sky" /> Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        value={loginForm.email}
                                        onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                                        placeholder="you@example.com"
                                        className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl focus:ring-prism-sky/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                        <User className="w-3.5 h-3.5 text-prism-sky" /> Password
                                    </label>
                                    <Input
                                        type="password"
                                        value={loginForm.password}
                                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl focus:ring-prism-sky/50"
                                        required
                                    />
                                </div>
                                
                                {error && (
                                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-semibold">
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" disabled={loginLoading} className="w-full bg-prism-sky hover:bg-prism-sky/90 text-white font-bold h-11 rounded-xl shadow-glow mt-2 transition-all active:scale-[0.98] flex items-center justify-center">
                                    {loginLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                                    {loginLoading ? "Signing In..." : "Sign In"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="p-6 m-0 outline-none max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <form onSubmit={handleSignupSubmit} className="space-y-4">
                                <AnimatePresence mode="wait">
                                    {signupStep === 1 ? (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                    <User className="w-3.5 h-3.5 text-prism-sky" /> Full Name
                                                </label>
                                                <Input
                                                    value={signupForm.name}
                                                    onChange={e => setSignupForm({ ...signupForm, name: e.target.value })}
                                                    placeholder="John Doe"
                                                    className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-prism-sky" /> Email Address
                                                </label>
                                                <Input
                                                    type="email"
                                                    value={signupForm.email}
                                                    onChange={e => setSignupForm({ ...signupForm, email: e.target.value })}
                                                    placeholder="you@example.com"
                                                    className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5 text-prism-sky" /> Password
                                                </label>
                                                <Input
                                                    type="password"
                                                    value={signupForm.password}
                                                    onChange={e => setSignupForm({ ...signupForm, password: e.target.value })}
                                                    placeholder="Min. 8 characters"
                                                    className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-11 rounded-xl"
                                                    required
                                                />
                                            </div>

                                            <div className="pt-1">
                                                <label className="text-[10px] uppercase tracking-wider font-bold text-white/50 ml-1 mb-2 block text-center">I am a...</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setRole("patient")}
                                                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${role === "patient"
                                                            ? "bg-prism-sky/20 border-prism-sky text-white shadow-glow"
                                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                                                            }`}
                                                    >
                                                        <User className="w-5 h-5" />
                                                        <span className="font-bold text-[10px] uppercase tracking-wider">Patient</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRole("doctor")}
                                                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${role === "doctor"
                                                            ? "bg-prism-glow/20 border-prism-glow text-white shadow-glow"
                                                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                                                            }`}
                                                    >
                                                        <Stethoscope className="w-5 h-5" />
                                                        <span className="font-bold text-[10px] uppercase tracking-wider">Doctor</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <Button type="submit" className="w-full bg-accent-gradient text-white font-bold h-11 rounded-xl shadow-glow mt-2">
                                                Next Step <LogIn className="w-4 h-4 ml-2" />
                                            </Button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-3"
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                                                    {role === "doctor" ? <Stethoscope className="w-4 h-4 text-prism-glow" /> : <User className="w-4 h-4 text-prism-sky" />}
                                                    {role === "doctor" ? "Medical Profile" : "Physical Profile"}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => setSignupStep(1)}
                                                    className="text-[10px] text-white/50 hover:text-white transition-colors"
                                                >
                                                    Back
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-prism-sky" /> Age
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={signupForm.age}
                                                        onChange={e => setSignupForm({ ...signupForm, age: e.target.value })}
                                                        placeholder="25"
                                                        className="bg-white/10 border-white/10 text-white placeholder:text-white/30 h-10 rounded-xl"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                        <Users className="w-3.5 h-3.5 text-prism-sky" /> Gender
                                                    </label>
                                                    <select
                                                        value={signupForm.gender}
                                                        onChange={e => setSignupForm({ ...signupForm, gender: e.target.value })}
                                                        className="flex h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-prism-sky"
                                                    >
                                                        <option value="male" className="bg-prism-navy underline">Male</option>
                                                        <option value="female" className="bg-prism-navy underline">Female</option>
                                                        <option value="other" className="bg-prism-navy underline">Other</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {role === "patient" ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                                <Weight className="w-3.5 h-3.5 text-prism-sky" /> Weight (kg)
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                value={signupForm.weight}
                                                                onChange={e => setSignupForm({ ...signupForm, weight: e.target.value })}
                                                                placeholder="70"
                                                                className="bg-white/10 border-white/10 text-white h-10 rounded-xl px-4"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                                <Ruler className="w-3.5 h-3.5 text-prism-sky" /> Height (cm)
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                value={signupForm.height}
                                                                onChange={e => setSignupForm({ ...signupForm, height: e.target.value })}
                                                                placeholder="170"
                                                                className="bg-white/10 border-white/10 text-white h-10 rounded-xl px-4"
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {bmi && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="bg-white/5 rounded-xl p-3 border border-white/10"
                                                        >
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Calculated BMI</span>
                                                                <span className="font-display font-bold text-white text-lg">{bmi}</span>
                                                            </div>
                                                            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${Math.min((parseFloat(bmi) / 40) * 100, 100)}%` }}
                                                                    className={`absolute top-0 left-0 h-full rounded-full ${bodyType === "Normal" ? "bg-green-400" :
                                                                        bodyType === "Underweight" ? "bg-amber-400" : "bg-red-400"
                                                                        }`}
                                                                />
                                                            </div>
                                                            <p className="text-[8px] text-white/40 mt-1.5 text-center uppercase font-bold tracking-tighter">
                                                                Category: {bodyType}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                            <Stethoscope className="w-3.5 h-3.5 text-prism-glow" /> Specialization
                                                        </label>
                                                        <Input
                                                            type="text"
                                                            value={signupForm.specialization}
                                                            onChange={e => setSignupForm({ ...signupForm, specialization: e.target.value })}
                                                            placeholder="e.g. Sports Physiotherapist"
                                                            className="bg-white/10 border-white/10 text-white h-11 rounded-xl"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-semibold text-white/70 ml-1 flex items-center gap-2">
                                                            <Briefcase className="w-3.5 h-3.5 text-prism-glow" /> License / Credentials
                                                        </label>
                                                        <Input
                                                            type="text"
                                                            value={signupForm.credentials}
                                                            onChange={e => setSignupForm({ ...signupForm, credentials: e.target.value })}
                                                            placeholder="MD, DPT, etc."
                                                            className="bg-white/10 border-white/10 text-white h-11 rounded-xl"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {error && (
                                                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-semibold mb-2">
                                                    {error}
                                                </div>
                                            )}

                                            <Button type="submit" disabled={signupLoading} className={`w-full text-white font-bold h-11 rounded-xl shadow-glow mt-2 active:scale-95 transition-all flex items-center justify-center ${role === 'doctor' ? 'bg-gradient-to-r from-prism-glow to-amber-500' : 'bg-prism-sky'}`}>
                                                {signupLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                                {signupLoading ? "Creating Account..." : "Complete Setup"}
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="px-6 pb-6 pt-2 text-center relative z-10">
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
                            Protected by Prism Shield™ Encryption
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LoginModal;
