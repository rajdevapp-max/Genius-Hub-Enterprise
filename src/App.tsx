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
import DatabasePage from "@/pages/DatabasePage"; // 🎯 ADDED: Database Import
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// --- THE SMART LOCK SECURITY WRAPPER ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // We check the URL for your specific "?demo=demo-BATS" secret key!
  const isDemoSite = window.location.search.includes("demo=demo-BATS");
  const isAuthenticated = sessionStorage.getItem('bats_demo_auth') === 'true';
  
  // Only lock them out if the link has "?demo=demo-BATS" AND they aren't logged in.
  if (isDemoSite && !isAuthenticated) {
    // 🎯 SECURITY FIX: Safely preserves the demo tag when redirecting to login
    return <Navigate to={`/login${window.location.search}`} replace />;
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
                  
                  {/* 🎯 ADDED: Database Route (Fixes the 404!) */}
                  <Route path="/database" element={<DatabasePage />} />
                  
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