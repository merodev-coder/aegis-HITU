import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";


import LandingLayout from "./layouts/LandingLayout";
import DashboardLayout from "./layouts/DashboardLayout";


import Home from "./pages/Home";
import AIEngine from "./pages/AIEngine";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { 
            background: '#111318', 
            color: '#ffffff', 
            border: '1px solid rgba(0, 212, 195, 0.3)', 
            backdropFilter: 'blur(8px)' 
          }, 
          success: { 
            iconTheme: { primary: '#00d4c3', secondary: '#111318' } 
          } 
        }} 
      />
      <BrowserRouter>
        <Routes>
          
          <Route element={<LandingLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/ai-engine" element={<AIEngine />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          
          <Route path="/dashboard/*" element={<DashboardLayout />} />

          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
