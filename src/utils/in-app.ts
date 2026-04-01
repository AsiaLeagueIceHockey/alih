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
    return { isInApp: false, isAndroid: false, isIOS: false, hasSamsungBrowser: false };
  }

  const ua = navigator.userAgent.toUpperCase();
  const isInApp = IN_APP_SIGNATURES.some((sig) => ua.includes(sig));
  const isAndroid = /ANDROID/i.test(ua);
  const isIOS = /IPHONE|IPAD|IPOD/i.test(ua);
  // Samsung Internet 브라우저가 설치되어 있는지 감지 (user agent에 SamsungBrowser가 포함됨)
  const hasSamsungBrowser = /SAMSUNGBROWSER/i.test(ua);

  return { isInApp, isAndroid, isIOS, hasSamsungBrowser };
};

/**
 * Android: 외부 브라우저로 리다이렉트 시도
 *   1. Samsung Browser 감지 시 → Samsung Internet으로 리다이렉트
 *   2. 그 외 → Chrome으로 리다이렉트 시도
 *   3. Chrome 미설치 시 → 기본 브라우저로 fallback
 * iOS: 강제 불가, shouldShowGuide: true 반환
 */
export const handleInAppBrowser = (): { shouldShowGuide: boolean } => {
  const { isInApp, isAndroid, isIOS, hasSamsungBrowser } = getInAppBrowserStatus();

  if (!isInApp) {
    return { shouldShowGuide: false };
  }

  // Android: 외부 브라우저로 리다이렉트
  if (isAndroid) {
    const currentUrl = window.location.href;
    const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, '');
    
    // Samsung 기기에서 Samsung Internet이 있으면 그것으로 열기
    if (hasSamsungBrowser) {
      // Samsung Internet intent
      const samsungIntent = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.sec.android.app.sbrowser;end`;
      window.location.href = samsungIntent;
      return { shouldShowGuide: false };
    }
    
    // Chrome으로 시도, 실패 시 기본 브라우저로 fallback
    // S.browser_fallback_url을 사용하면 Chrome이 없을 때 일반 브라우저로 열림
    const chromeIntent = `intent://${urlWithoutProtocol}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
    window.location.href = chromeIntent;
    return { shouldShowGuide: false };
  }

  // iOS: 가이드 표시
  if (isIOS) {
    return { shouldShowGuide: true };
  }

  return { shouldShowGuide: false };
};
