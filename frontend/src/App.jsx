import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import Chatbot from "./pages/Chatbot";
import VoiceAssistant from "./pages/VoiceAssistant";
import About from "./pages/About";

export default function App() {
  const location = useLocation();
  // On the dashboard view (/app), the dashboard has its own topbar & sidebar
  const isDashboardRoute = location.pathname === "/app";

  return (
    <>
      {!isDashboardRoute && <Navbar />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/app"     element={<Dashboard />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/history" element={<History />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/voice"   element={<VoiceAssistant />} />
          <Route path="/about"   element={<About />} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{ className: "toast" }} />
    </>
  );
}
