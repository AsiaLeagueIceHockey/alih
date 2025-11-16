import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import BottomNav from "./components/BottomNav";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Schedule = lazy(() => import("./pages/Schedule"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const Highlights = lazy(() => import("./pages/Highlights"));
const Standings = lazy(() => import("./pages/Standings"));
const News = lazy(() => import("./pages/News"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/schedule/:gameNo" element={<GameDetail />} />
              <Route path="/highlights" element={<Highlights />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/news" element={<News />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
