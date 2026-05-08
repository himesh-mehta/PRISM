import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiUrl } from "@/lib/api";

export interface UserProfile {
  user_id?: string;
  patient_id?: string;
  doctor_id?: string;
  users_id?: string;
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  bmi: number;
  bodyType: string;
  gender: string;
  role: "patient" | "doctor";
  password?: string;
  credentials?: string;
  specialization?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (profile: UserProfile, isSignup?: boolean) => Promise<void>;
  signup: (profile: UserProfile) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => { },
  signup: async () => { },
  logout: () => { },
  isAuthenticated: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

function calculateBMI(weight: number, height: number): number {
  if (!weight || !height) return 0;
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(1));
}

function getBodyType(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for an existing user
    const savedUser = localStorage.getItem("prism_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (profile: UserProfile, isSignup = false) => {
    const bmi = calculateBMI(profile.weight, profile.height);
    const fullProfile: any = {
      ...profile,
      bmi,
      bodyType: getBodyType(bmi),
      // Always preserve IDs from server responses
      user_id: (profile as any).user_id || profile.user_id,
      patient_id: (profile as any).patient_id || null,
      users_id: (profile as any).users_id || null,
      doctor_id: (profile as any).doctor_id || null,
    };

    if (isSignup) {
      try {
        console.log("📤 Sending signup to server...");
        const response = await fetch(apiUrl("/api/signup"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullProfile),
        });
        
        const data = await response.json();
        if (data.success && data.user) {
          console.log("✅ User saved to Neon. ID:", data.user.user_id);
          fullProfile.user_id   = data.user.user_id;
          fullProfile.patient_id = data.user.patient_id;
          fullProfile.users_id  = data.user.users_id;
          fullProfile.doctor_id = data.user.doctor_id || null;
        } else {
          console.error("❌ Database sync failed:", data.error);
        }
      } catch (err) {
        console.error("❌ Server connection error during signup:", err);
      }
    }

    console.log("✅ [AUTH] Storing user with patient_id:", fullProfile.patient_id);
    setUser(fullProfile);
    localStorage.setItem("prism_user", JSON.stringify(fullProfile));
  };

  const signup = async (profile: UserProfile) => {
    await login(profile, true);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("prism_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
