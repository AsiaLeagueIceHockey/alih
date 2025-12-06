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
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const InstagramScore = lazy(() => import("./pages/InstagramScore"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분 기본 캐시
      gcTime: 1000 * 60 * 30, // 30분 동안 메모리 유지
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* 인스타그램 전용 뷰 - BottomNav 없음 */}
              <Route path="/instagram/score" element={
                <Suspense fallback={<LoadingFallback />}>
                  <InstagramScore />
                </Suspense>
              } />
              
              {/* 일반 페이지 - BottomNav 포함 */}
              <Route path="*" element={
                <div className="min-h-screen">
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/schedule" element={<Schedule />} />
                      <Route path="/schedule/:gameNo" element={<GameDetail />} />
                      <Route path="/highlights" element={<Highlights />} />
                      <Route path="/standings" element={<Standings />} />
                      <Route path="/team/:teamId" element={<TeamDetail />} />
                      <Route path="/news" element={<News />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <BottomNav />
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
