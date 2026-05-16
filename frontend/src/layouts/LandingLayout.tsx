import { Outlet } from "react-router-dom";
import { ReactLenis } from "lenis/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AnimatedBackground from "../components/ui/AnimatedBackground";

export default function LandingLayout() {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      <div className="relative flex min-h-screen flex-col bg-aegis-bg">
        <AnimatedBackground />
        <Navbar />
        
        <main className="relative z-10 flex-1 pt-16">
          <Outlet />
        </main>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    </ReactLenis>
  );
}
