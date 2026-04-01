import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import InstallGuideModal from "@/components/install-guide-modal";

const InstallPrompt = () => {
  const { t } = useTranslation();
  const {
    isInstallable,
    isIOS,
    isStandalone,
    isDismissed,
    promptInstall,
    dismissBanner,
    showIOSGuide,
    setShowIOSGuide,
  } = useInstallPrompt();

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 20초 뒤에 배너 노출
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  // 숨김 조건: 이미 PWA, 닫음 처리됨, 또는 시간 미도달 (Android/iOS 무관하게 PWA 아니면 노출 시도)
  // 단, iOS의 '설치' 가이드는 OS 제한으로 Standalone이 아닐 때만 의미 있음
  // Android는 Standalone이면 숨김 (이미 설치됨)
  // 여기서는 "알림 유도"가 목적이므로, Standalone이라도 알림 권한이 없으면 보여주는 로직이 이상적이나
  // 현재 요구사항은 "20초 뒤 노출"에 집중.
  // 기존 로직 유지하되 timer 추가.
  const shouldHide =
    !showBanner || isStandalone || isDismissed || (!isInstallable && !isIOS);

  if (shouldHide) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      await promptInstall();
    }
  };

  return (
    <>
      {/* 하단 고정 배너 - BottomNav 위에 위치 */}
      <div 
        className="fixed left-0 right-0 z-40 px-3 pb-2"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="bg-gradient-to-r from-primary/90 to-primary rounded-xl shadow-lg p-3 flex items-center gap-3">
          {/* 앱 로고 */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <img
              src="/favicon-48x48.png"
              alt="ALIH"
              className="w-7 h-7 rounded"
            />
          </div>

          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {t("installPrompt.bannerText")}
            </p>
            <p className="text-xs text-white/70 truncate">
              {t("installPrompt.bannerSubtext")}
            </p>
          </div>

          {/* 설치 버튼 */}
          <Button
            variant="secondary"
            size="sm"
            className="flex-shrink-0 bg-white text-primary hover:bg-white/90 font-medium"
            onClick={handleInstallClick}
          >
            <Download className="w-4 h-4 mr-1" />
            {t("installPrompt.installButton")}
          </Button>

          {/* 닫기 버튼 */}
          <button
            onClick={dismissBanner}
            className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* iOS 설치 가이드 모달 */}
      <InstallGuideModal open={showIOSGuide} onOpenChange={setShowIOSGuide} />
    </>
  );
};

export default InstallPrompt;
