/**
 * In-App Browser Handler
 * Detects if the app is running inside an in-app browser (Kakao, Naver, Instagram, etc.)
 * and provides logic to escape or guide the user to an external browser.
 */

const IN_APP_SIGNATURES = [
  'KAKAOTALK',
  'NAVER',
  'INSTAGRAM',
  'FBAN', // Facebook App
  'FBAV', // Facebook App
  'TWITTER',
  'LINE',
  'SNAPCHAT',
  'BAND',
];

export const getInAppBrowserStatus = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isInApp: false, isAndroid: false, isIOS: false };
  }

  const ua = navigator.userAgent.toUpperCase();
  const isInApp = IN_APP_SIGNATURES.some((sig) => ua.includes(sig));
  const isAndroid = /ANDROID/i.test(ua);
  const isIOS = /IPHONE|IPAD|IPOD/i.test(ua);

  return { isInApp, isAndroid, isIOS };
};

/**
 * Android: intent:// 스킴으로 Chrome 강제 실행
 * iOS: 강제 불가, shouldShowGuide: true 반환
 */
export const handleInAppBrowser = (): { shouldShowGuide: boolean } => {
  const { isInApp, isAndroid, isIOS } = getInAppBrowserStatus();

  if (!isInApp) {
    return { shouldShowGuide: false };
  }

  // Android: Chrome으로 리다이렉트
  if (isAndroid) {
    const currentUrl = window.location.href;
    // intent:// 스킴 구성
    const intentUrl = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    
    // 즉시 리다이렉트
    window.location.href = intentUrl;
    return { shouldShowGuide: false };
  }

  // iOS: 가이드 표시
  if (isIOS) {
    return { shouldShowGuide: true };
  }

  return { shouldShowGuide: false };
};
