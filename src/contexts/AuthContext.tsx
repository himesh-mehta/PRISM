import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserProfile {
  name: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  bmi: number;
  bodyType: string;
  gender: string;
  role: "patient" | "doctor";
  credentials?: string;
  specialization?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  login: (profile: UserProfile) => void;
  signup: (profile: UserProfile) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => { },
  signup: () => { },
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

  const login = (profile: UserProfile) => {
    const bmi = calculateBMI(profile.weight, profile.height);
    const fullProfile = {
      ...profile,
      bmi,
      bodyType: getBodyType(bmi),
    };
    setUser(fullProfile);
    localStorage.setItem("prism_user", JSON.stringify(fullProfile));
  };

  const signup = (profile: UserProfile) => {
    login(profile);
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
