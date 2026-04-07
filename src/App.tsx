import React from "react";
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
import DatabasePage from "@/pages/DatabasePage"; 
import NotFound from "@/pages/NotFound"; // Fixed path to match others

const queryClient = new QueryClient();

// --- THE SMART LOCK SECURITY WRAPPER ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isDemoSite = window.location.search.includes("demo=demo-BATS");
  const isAuthenticated = sessionStorage.getItem('bats_demo_auth') === 'true';
  
  if (isDemoSite && !isAuthenticated) {
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