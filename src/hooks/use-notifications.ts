import { useState } from 'react';
import { externalSupabase } from '@/lib/supabase-external';
import { useAuth } from '@/context/AuthContext';

// NOTE: This public key should be from your VAPID keys.
// You can generate one using web-push library: webpush.generateVAPIDKeys()
// For now, this is a placeholder. You MUST replace this.
const VAPID_PUBLIC_KEY = "REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY";

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
    Notification.permission
  );

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        await subscribeToPush();
      }
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const subscribeToPush = async () => {
    if (!user) return;
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe new
        if (VAPID_PUBLIC_KEY === "REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY") {
           console.warn("VAPID Key not set. Skipping subscription.");
           return;
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
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, token' });

      if (error) {
        console.error('Error saving notification token:', error);
      } else {
        console.log('Notification token saved!');
      }

    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  return {
    permission,
    requestPermission,
  };
}
