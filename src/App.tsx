import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import PostureDetection from "./pages/PostureDetection";
import ExerciseTracker from "./pages/ExerciseTracker";
import ExerciseLibrary from "./pages/ExerciseLibrary";
import AIChatbot from "./pages/AIChatbot";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import DashboardLayout from "./components/DashboardLayout";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PrescriptionBuilder from "./pages/doctor/PrescriptionBuilder";
import PatientDetail from "./pages/doctor/PatientDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const ProtectedRoute = ({ children, requireRole }: { children: React.ReactNode, requireRole?: "patient" | "doctor" }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-prism-navy flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-prism-sky border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/" state={{ openLogin: true, from: location }} replace />;

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={user?.role === "doctor" ? "/doctor/dashboard" : "/dashboard"} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

import { ThemeProvider } from "@/components/ThemeProvider";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />

              {/* Patient Routes */}
              <Route path="/dashboard" element={<ProtectedRoute requireRole="patient"><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/posture" element={<ProtectedRoute requireRole="patient"><PostureDetection /></ProtectedRoute>} />
              <Route path="/dashboard/tracker" element={<ProtectedRoute requireRole="patient"><ExerciseTracker /></ProtectedRoute>} />
              <Route path="/dashboard/library" element={<ProtectedRoute requireRole="patient"><ExerciseLibrary /></ProtectedRoute>} />
              <Route path="/dashboard/chatbot" element={<ProtectedRoute requireRole="patient"><AIChatbot /></ProtectedRoute>} />
              <Route path="/dashboard/reports" element={<ProtectedRoute requireRole="patient"><Reports /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={<ProtectedRoute requireRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/doctor/patient/:id" element={<ProtectedRoute requireRole="doctor"><PatientDetail /></ProtectedRoute>} />
              <Route path="/doctor/prescription" element={<ProtectedRoute requireRole="doctor"><PrescriptionBuilder /></ProtectedRoute>} />
              <Route path="/doctor/settings" element={<ProtectedRoute requireRole="doctor"><SettingsPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
