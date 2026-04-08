import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AboutSection from "@/components/AboutSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "signup">("login");
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleOpenLogin = (tab: "login" | "signup" = "login") => {
    setModalTab(tab);
    setIsLoginOpen(true);
  };

  const handleJoinClick = () => {
    if (isAuthenticated) {
      navigate(user?.role === "doctor" ? "/doctor/dashboard" : "/dashboard");
    } else {
      handleOpenLogin("signup");
    }
  };

  const handleLoginClick = () => {
    if (isAuthenticated) {
      navigate(user?.role === "doctor" ? "/doctor/dashboard" : "/dashboard");
    } else {
      handleOpenLogin("login");
    }
  };

  const handleCardClick = (path: string) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      handleOpenLogin("login");
    }
  };

  useEffect(() => {
    if (location.state?.openLogin) {
      handleOpenLogin("login");
    }
  }, [location.state]);

  return (
    <div className="min-h-screen">
      <Navbar onLoginClick={handleLoginClick} onJoinClick={handleJoinClick} />
      <HeroSection onJoinClick={handleJoinClick} />
      <FeaturesSection onCardClick={handleCardClick} />
      <AboutSection />
      <HowItWorksSection />
      <ContactSection />
      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} initialTab={modalTab} />
    </div>
  );
};

export default Index;
