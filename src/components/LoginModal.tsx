import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { LogIn, UserPlus, User, Mail, Ruler, Weight, Calendar, Users, Briefcase, Stethoscope, X } from "lucide-react";
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
    const { login } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"login" | "signup" | "google-setup">(initialTab);

    // Sync activeTab with initialTab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Login State
    const [loginForm, setLoginForm] = useState({ email: "", password: "" });
    const [loginLoading, setLoginLoading] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [googleUser, setGoogleUser] = useState<any | null>(null); // For intermediate state setup

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
            await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
            onClose();
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Failed to sign in. Please check your credentials.");
        } finally {
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
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, signupForm.email, signupForm.password);
            const firebaseUser = userCredential.user;

            const profileData = {
                name: signupForm.name,
                email: signupForm.email,
                age: parseInt(signupForm.age),
                weight: parseFloat(signupForm.weight) || 0,
                height: parseFloat(signupForm.height) || 0,
                gender: signupForm.gender,
                role: role,
                credentials: signupForm.credentials || "",
                specialization: signupForm.specialization || ""
            };

            await setDoc(doc(db, "users", firebaseUser.uid), profileData);

            // Fetch profile for immediate trigger
            login(profileData as any);

            onClose();
            if (role === "doctor") {
                navigate("/doctor/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err: any) {
            console.error("Signup error:", err);
            setError(err.message || "Failed to create account.");
        } finally {
            setSignupLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                setGoogleUser(firebaseUser);
                setActiveTab("google-setup");
            } else {
                const data = docSnap.data();
                onClose();
                if (data?.role === "doctor") {
                    navigate("/doctor/dashboard");
                } else {
                    navigate("/dashboard");
                }
            }
        } catch (err: any) {
            console.error("Google Auth error:", err);
            setError(err.message || "Google Authentication failed.");
        }
    };

    const handleGoogleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!googleUser) return;

        setSignupLoading(true);
        try {
            const profileData = {
                name: googleUser.displayName || signupForm.name || "Google User",
                email: googleUser.email,
                age: parseInt(signupForm.age),
                weight: parseFloat(signupForm.weight) || 0,
                height: parseFloat(signupForm.height) || 0,
                gender: signupForm.gender,
                role: role,
                credentials: signupForm.credentials || "",
                specialization: signupForm.specialization || ""
            };

            await setDoc(doc(db, "users", googleUser.uid), profileData);

            login(profileData as any);
            onClose();
            
            if (role === "doctor") {
                navigate("/doctor/dashboard");
            } else {
                navigate("/dashboard");
            }
        } catch (err: any) {
            console.error("Google Profile Completion Error:", err);
            setError(err.message || "Failed to complete setup.");
        } finally {
            setSignupLoading(false);
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
                                <div className="flex justify-end">
                                    <button type="button" className="text-[10px] text-prism-sky hover:text-white transition-colors">
                                        Forgot Password?
                                    </button>
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

                                <div className="relative flex items-center justify-center my-4">
                                    <div className="border-t border-white/10 w-full" />
                                    <span className="absolute bg-prism-navy/95 px-3 text-[10px] text-white/40 uppercase font-bold tracking-wider">or</span>
                                </div>

                                <Button type="button" onClick={handleGoogleSignIn} className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 h-11 rounded-xl transition-all flex items-center justify-center gap-2">
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                                    Continue with Google
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

                                            <div className="relative flex items-center justify-center my-4">
                                                <div className="border-t border-white/10 w-full" />
                                                <span className="absolute bg-prism-navy/95 px-3 text-[10px] text-white/40 uppercase font-bold tracking-wider">or</span>
                                            </div>

                                            <Button type="button" onClick={handleGoogleSignIn} className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 h-11 rounded-xl transition-all flex items-center justify-center gap-2">
                                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                                                Continue with Google
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

                        <TabsContent value="google-setup" className="p-6 m-0 outline-none max-h-[60vh] overflow-y-auto custom-scrollbar text-white">
                            <div className="text-center mb-4">
                                <h3 className="font-display text-xl font-bold">Complete Setup</h3>
                                <p className="text-white/60 text-xs">Hello {googleUser?.displayName || "there"}, provide your details to continue.</p>
                            </div>

                            <form onSubmit={handleGoogleCompleteProfile} className="space-y-4">
                                <div className="pt-1">
                                    <label className="text-[10px] uppercase font-bold text-white/50 mb-2 block text-center">I am a...</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button type="button" onClick={() => setRole("patient")} className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${role === "patient" ? "bg-prism-sky/20 border-prism-sky text-white shadow-glow" : "bg-white/5 border-white/10"}`}>
                                            <User className="w-4 h-4" /> <span className="font-bold text-[10px]">Patient</span>
                                        </button>
                                        <button type="button" onClick={() => setRole("doctor")} className={`p-3 rounded-xl border flex flex-col items-center gap-1 ${role === "doctor" ? "bg-prism-glow/20 border-prism-glow text-white shadow-glow" : "bg-white/5 border-white/10"}`}>
                                            <Stethoscope className="w-4 h-4" /> <span className="font-bold text-[10px]">Doctor</span>
                                        </button>
                                    </div>
                                </div>

                                {role === "patient" ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs">Age</label>
                                            <Input type="number" required value={signupForm.age} onChange={e => setSignupForm({ ...signupForm, age: e.target.value })} className="bg-white/10 border-white/10 h-10 rounded-xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs">Gender</label>
                                            <select value={signupForm.gender} onChange={e => setSignupForm({ ...signupForm, gender: e.target.value })} className="h-10 w-full rounded-xl border border-white/10 bg-white/10 px-2 text-sm text-white">
                                                <option value="male" className="bg-prism-navy">Male</option>
                                                <option value="female" className="bg-prism-navy">Female</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs">Weight</label>
                                            <Input type="number" required value={signupForm.weight} onChange={e => setSignupForm({ ...signupForm, weight: e.target.value })} className="bg-white/10 border-white/10 h-10 rounded-xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs">Height</label>
                                            <Input type="number" required value={signupForm.height} onChange={e => setSignupForm({ ...signupForm, height: e.target.value })} className="bg-white/10 border-white/10 h-10 rounded-xl" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs">Specialization</label>
                                            <Input type="text" required value={signupForm.specialization} onChange={e => setSignupForm({ ...signupForm, specialization: e.target.value })} className="bg-white/10 border-white/10 h-10 rounded-xl" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs">Credentials</label>
                                            <Input type="text" required value={signupForm.credentials} onChange={e => setSignupForm({ ...signupForm, credentials: e.target.value })} className="bg-white/10 border-white/10 h-10 rounded-xl" />
                                        </div>
                                    </div>
                                )}

                                {error && <div className="p-2 text-red-400 text-xs text-center">{error}</div>}

                                <Button type="submit" disabled={signupLoading} className={`w-full text-white font-bold h-11 rounded-xl shadow-glow ${role === 'doctor' ? 'bg-gradient-to-r from-prism-glow to-amber-500' : 'bg-prism-sky'}`}>
                                    {signupLoading ? "Completing..." : "Launch Profile"}
                                </Button>
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
