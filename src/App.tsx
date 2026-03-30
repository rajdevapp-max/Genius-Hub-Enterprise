import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "@/components/Layout";
import Scene3D from "@/components/Scene3D";
import WaveBackground from "@/components/WaveBackground";
import SearchPage from "@/pages/SearchPage";
import JDMatchPage from "@/pages/JDMatchPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import UploadPage from "@/pages/UploadPage";
import LoginPage from "@/pages/LoginPage"; // <-- NEW: Imported your Login Page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// --- THE SMART LOCK SECURITY WRAPPER ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // 1. Check if we are currently on the DEMO website link
  const isDemoSite = window.location.hostname.includes("resume-bats.vercel.app");
  
  // 2. Check if the user has successfully logged in
  const isAuthenticated = localStorage.getItem('bats_demo_auth') === 'true';
  
  // 3. THE MAGIC: If it's the demo site AND they aren't logged in, block them!
  // If it's your original 37K site, this gets ignored completely.
  if (isDemoSite && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WaveBackground />
      <Scene3D />
      <BrowserRouter>
        <Routes>
          
          {/* UNLOCKED: The Login Page (Stands alone, no sidebar layout) */}
          <Route path="/login" element={<LoginPage />} />

          {/* LOCKED: The Entire App is wrapped in the Smart Lock and Layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<SearchPage />} />
                  <Route path="/jd-match" element={<JDMatchPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;