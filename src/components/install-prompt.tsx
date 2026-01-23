import { useTranslation } from "react-i18next";
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

  // 숨김 조건: 이미 PWA, 닫음 처리됨, 또는 설치 불가능 상태(Android)이면서 iOS도 아님
  const shouldHide =
    isStandalone || isDismissed || (!isInstallable && !isIOS);

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
