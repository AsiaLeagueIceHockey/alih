import { useState, useEffect, useCallback } from 'react';
import { externalSupabase } from '@/lib/supabase-external';
import { useAuth } from '@/context/AuthContext';

// NOTE: This public key should be from your VAPID keys.
// You can generate one using web-push library: webpush.generateVAPIDKeys()
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [hasToken, setHasToken] = useState<boolean | null>(null); // null = loading
  const [isCheckingToken, setIsCheckingToken] = useState(false);

  // DB에서 토큰 존재 여부 확인
  const checkTokenInDb = useCallback(async () => {
    if (!user) {
      setHasToken(null);
      return;
    }

    setIsCheckingToken(true);
    try {
      const { data, error } = await externalSupabase
        .from('notification_tokens')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) {
        console.error('Error checking token:', error);
        setHasToken(false);
        return;
      }

      setHasToken(data && data.length > 0);
    } catch (error) {
      console.error('Error checking token:', error);
      setHasToken(false);
    } finally {
      setIsCheckingToken(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // user.id만 dependency로 사용하여 불필요한 재생성 방지

  // 사용자가 로그인되면 토큰 확인 (최초 1회)
  useEffect(() => {
    if (user?.id) {
      checkTokenInDb();
    } else {
      setHasToken(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // checkTokenInDb 제거하여 무한 루프 방지

  const subscribeToPush = async () => {
    if (!user) return false;
    if (!('serviceWorker' in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe new
        if (!VAPID_PUBLIC_KEY) {
           console.warn("VITE_VAPID_PUBLIC_KEY is not set in .env. Notifications cannot be enabled.");
           alert("알림 설정을 위한 VAPID 키가 설정되지 않았습니다. 관리자에게 문의하세요.");
           return false;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Save token to Supabase
      const { error } = await externalSupabase
        .from('notification_tokens')
        .upsert({
          user_id: user.id,
          token: subscription.toJSON(), // Stores endpoint, keys
          platform: 'web',
        }, { onConflict: 'user_id, token' });

      if (error) {
        console.error('Error saving notification token:', error);
        return false;
      } else {
        console.log('Notification token saved!');
        setHasToken(true); // 토큰 저장 성공 시 상태 업데이트
        return true;
      }

    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  };

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notification API not supported in this environment');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        const subResult = await subscribeToPush();
        return subResult ? 'granted' : 'error';
      }
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  // 권한은 있지만 토큰이 없는 경우 재등록
  const resubscribeToPush = async () => {
    if (permission !== 'granted') {
      // 권한이 없으면 먼저 권한 요청
      return await requestPermission();
    }
    
    // 권한이 있으면 바로 구독
    const result = await subscribeToPush();
    if (result) {
      return 'granted';
    }
    return 'error';
  };

  const refreshPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  return {
    permission,
    hasToken,
    isCheckingToken,
    requestPermission,
    resubscribeToPush,
    refreshPermission,
    checkTokenInDb,
  };
}
