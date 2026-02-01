import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { lazy, Suspense, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import BottomNav from "./components/BottomNav";
import ScrollToTop from "./components/ScrollToTop";
import InstallPrompt from "./components/install-prompt";
import './i18n'; // i18n initialization
import { AuthProvider } from "./context/AuthContext";
import OnboardingDialog from "./components/auth/OnboardingDialog";
import { handleInAppBrowser } from "./utils/in-app";
import InAppGuide from "./components/common/InAppGuide";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Schedule = lazy(() => import("./pages/Schedule"));
const GameDetail = lazy(() => import("./pages/GameDetail"));
const Highlights = lazy(() => import("./pages/Highlights"));
const Standings = lazy(() => import("./pages/Standings"));
const News = lazy(() => import("./pages/News"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const TeamRoster = lazy(() => import("./pages/TeamRoster"));
const PlayerDetail = lazy(() => import("./pages/PlayerDetail"));
const PlayerCard = lazy(() => import("./pages/PlayerCard"));
const InstagramScore = lazy(() => import("./pages/InstagramScore"));
const InstagramPreview = lazy(() => import("./pages/InstagramPreview"));
const InstagramGoals = lazy(() => import("./pages/InstagramGoals"));
const InstagramWeeklyStats = lazy(() => import("./pages/InstagramWeeklyStats"));
const InstagramStandings = lazy(() => import("./pages/InstagramStandings"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminPushTest = lazy(() => import("./pages/AdminPushTest"));
const AdminComments = lazy(() => import("./pages/AdminComments"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분 기본 캐시
      gcTime: 1000 * 60 * 60 * 24, // 24시간 동안 메모리 유지 (persist용으로 증가)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// localStorage에 React Query 캐시를 영구 저장
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'alih-cache',
});

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const ConditionalBottomNav = () => {
  const location = useLocation();
  // 인스타그램 및 어드민 경로에서는 BottomNav 숨김
  if (location.pathname.startsWith('/instagram') || location.pathname.startsWith('/admin')) {
    return null;
  }
  return <BottomNav />;
};

const ConditionalInstallPrompt = () => {
  const location = useLocation();
  // 인스타그램 및 어드민 경로에서는 InstallPrompt 숨김
  if (location.pathname.startsWith('/instagram') || location.pathname.startsWith('/admin')) {
    return null;
  }
  return <InstallPrompt />;
};

const App = () => {
  // [2026-02-01] InAppGuide 주석 처리 - 인스타그램에서 유입 시 이탈 유발
  // const [showInAppGuide, setShowInAppGuide] = useState(false);

  // useEffect(() => {
  //   const { shouldShowGuide } = handleInAppBrowser();
  //   if (shouldShowGuide) {
  //     setShowInAppGuide(true);
  //   }
  // }, []);

  return (
    <HelmetProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24시간 후 캐시 만료
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              // 에러가 없는 쿼리만 저장
              return query.state.status === 'success';
            },
          },
        }}
      >
        <AuthProvider>
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
              <Route path="/instagram/preview" element={
                <Suspense fallback={<LoadingFallback />}>
                  <InstagramPreview />
                </Suspense>
              } />
              <Route path="/instagram/goals" element={
                <Suspense fallback={<LoadingFallback />}>
                  <InstagramGoals />
                </Suspense>
              } />
              <Route path="/instagram/weekly-stats" element={
                <Suspense fallback={<LoadingFallback />}>
                  <InstagramWeeklyStats />
                </Suspense>
              } />
              <Route path="/instagram/standings" element={
                <Suspense fallback={<LoadingFallback />}>
                  <InstagramStandings />
                </Suspense>
              } />
              
              {/* 일반 페이지 - BottomNav 포함 */}
              <Route path="/" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Home />
                </Suspense>
              } />
              <Route path="/schedule" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Schedule />
                </Suspense>
              } />
              <Route path="/schedule/:gameNo" element={
                <Suspense fallback={<LoadingFallback />}>
                  <GameDetail />
                </Suspense>
              } />
              <Route path="/highlights" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Highlights />
                </Suspense>
              } />
              <Route path="/standings" element={
                <Suspense fallback={<LoadingFallback />}>
                  <Standings />
                </Suspense>
              } />
              <Route path="/team/:teamId" element={
                <Suspense fallback={<LoadingFallback />}>
                  <TeamDetail />
                </Suspense>
              } />
              <Route path="/roster/:teamId" element={
                <Suspense fallback={<LoadingFallback />}>
                  <TeamRoster />
                </Suspense>
              } />
              <Route path="/player/:playerSlug" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PlayerDetail />
                </Suspense>
              } />
              <Route path="/player/:playerSlug/card" element={
                <Suspense fallback={<LoadingFallback />}>
                  <PlayerCard />
                </Suspense>
              } />
              <Route path="/news" element={
                <Suspense fallback={<LoadingFallback />}>
                  <News />
                </Suspense>
              } />
              {/* 어드민 페이지 */}
              <Route path="/admin/test-push" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminPushTest />
                </Suspense>
              } />
              <Route path="/admin/comments" element={
                <Suspense fallback={<LoadingFallback />}>
                  <AdminComments />
                </Suspense>
              } />
              <Route path="*" element={
                <Suspense fallback={<LoadingFallback />}>
                  <NotFound />
                </Suspense>
              } />
            </Routes>
            <ConditionalInstallPrompt />
            <ConditionalBottomNav />
            <OnboardingDialog />
            {/* [2026-02-01] InAppGuide 주석 처리 */}
            {/* {showInAppGuide && (
              <InAppGuide onClose={() => setShowInAppGuide(false)} />
            )} */}
          </BrowserRouter>
        </TooltipProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
