import { useState } from 'react';
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
          // removing updated_at if not in table or ensuring we have created_at default
        }, { onConflict: 'user_id, token' });

      if (error) {
        console.error('Error saving notification token:', error);
        return false;
      } else {
        console.log('Notification token saved!');
        return true;
      }

    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  };



  const refreshPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  return {
    permission,
    requestPermission,
    refreshPermission,
  };
}
