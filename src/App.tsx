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
import LoginPage from "@/pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// --- THE SMART LOCK SECURITY WRAPPER ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // 🎯 THE FIX: Identify your ORIGINAL site and LOCALHOST
  const isOriginalSite = window.location.hostname.includes("resume-bats.vercel.app") || window.location.hostname.includes("localhost");
  
  // 🎯 If it is NOT the original site, it must be the Demo site!
  const isDemoSite = !isOriginalSite;
  
  const isAuthenticated = sessionStorage.getItem('bats_demo_auth') === 'true';
  
  // Only lock them out if they are on the Demo site AND not logged in
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
          <Route path="/login" element={<LoginPage />} />
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