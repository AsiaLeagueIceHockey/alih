import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, X, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InAppGuideProps {
  onClose?: () => void;
}

/**
 * iOS 인앱 브라우저 사용자에게 Safari로 열도록 안내하는 바텀시트 컴포넌트
 */
const InAppGuide = ({ onClose }: InAppGuideProps) => {
  const { i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const isKo = i18n.language === 'ko';
  const isJa = i18n.language === 'ja';

  const text = {
    title: isKo 
      ? '외부 브라우저(Safari)로 열어주세요' 
      : isJa 
        ? 'Safariで開いてください' 
        : 'Please open in Safari',
    desc: isKo 
      ? '앱 설치와 원활한 사용을 위해, 외부 브라우저로 열어주세요.' 
      : isJa 
        ? 'アプリのインストールとスムーズな利用のため、外部ブラウザで開いてください。' 
        : 'For app installation and smooth experience, please open in an external browser.',
    guide: isKo 
      ? "우측 메뉴(···) 클릭 👉 '브라우저로 열기' 선택" 
      : isJa 
        ? "右上メニュー(···) 👉 'ブラウザで開く'を選択" 
        : "Tap menu (···) 👉 'Open in Browser'",
    copy: isKo ? '현재 주소 복사하기' : isJa ? 'URLをコピー' : 'Copy Link',
    copied: isKo ? '복사됨!' : isJa ? 'コピーしました!' : 'Copied!',
    close: isKo ? '닫기' : isJa ? '閉じる' : 'Close',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* 바텀 시트 */}
      <div 
        className="bg-card border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex gap-4 items-start flex-1">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg leading-tight mb-1.5">{text.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text.desc}</p>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 가이드 박스 */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-5 border border-border/50">
            <p className="text-sm font-medium text-center flex items-center justify-center gap-2">
              🧭 {text.guide}
            </p>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-12 text-sm font-medium gap-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">{text.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {text.copy}
                </>
              )}
            </Button>
            <Button 
              className="flex-1 h-12 text-sm font-medium" 
              onClick={handleClose}
            >
              {text.close}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InAppGuide;
