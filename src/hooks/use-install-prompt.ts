import { useState, useEffect, useCallback } from "react";

const DISMISS_STORAGE_KEY = "pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UseInstallPromptReturn {
  isInstallable: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  isDismissed: boolean;
  promptInstall: () => Promise<void>;
  dismissBanner: () => void;
  showIOSGuide: boolean;
  setShowIOSGuide: (show: boolean) => void;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // iOS 디바이스 감지
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Standalone 모드 감지 (이미 PWA로 실행 중인지)
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

  // localStorage에서 dismiss 상태 확인
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
    } catch {
      // localStorage 접근 에러 무시
    }
  }, []);

  // beforeinstallprompt 이벤트 리스닝
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 앱이 설치되면 배너 숨김
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 설치 프롬프트 트리거
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  // 배너 닫기 (localStorage에 저장)
  const dismissBanner = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, "true");
      setIsDismissed(true);
    } catch {
      // localStorage 접근 에러 무시
      setIsDismissed(true);
    }
  }, []);

  return {
    isInstallable,
    isIOS,
    isStandalone,
    isDismissed,
    promptInstall,
    dismissBanner,
    showIOSGuide,
    setShowIOSGuide,
  };
}
