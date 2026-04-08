import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => { },
  logout: () => { },
  isAuthenticated: false,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

function calculateBMI(weight: number, height: number): number {
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const bmi = data.weight && data.height ? calculateBMI(data.weight, data.height) : 0;
            
            setUser({
              ...data,
              bmi,
              bodyType: getBodyType(bmi),
            } as UserProfile);
          } else {
            console.warn("No user profile found in Firestore for:", firebaseUser.uid);
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (profile: Omit<UserProfile, "bmi" | "bodyType"> & { bmi?: number; bodyType?: string; role?: "patient" | "doctor" }) => {
    // Left for fallback or immediate local state updates before socket trigger resolves
    const bmi = calculateBMI(profile.weight, profile.height);
    const fullProfile: UserProfile = {
      ...profile,
      bmi,
      bodyType: getBodyType(bmi),
      role: profile.role || "patient",
    };
    setUser(fullProfile);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
