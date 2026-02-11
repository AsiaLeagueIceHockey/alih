// Service Worker for Push Notifications

self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Asia League Ice Hockey';
  const options = {
    body: data.body || 'New update!',
    icon: '/favicon.png', // 192x192
    badge: '/favicon-48x48.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 구독 토큰이 브라우저에 의해 갱신될 때 자동 재구독
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[SW] Push subscription changed, re-subscribing...');
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options)
      .then(function(newSubscription) {
        console.log('[SW] Re-subscribed successfully:', newSubscription.endpoint);
        // 새 토큰을 DB에 저장하려면 앱 재방문 시 use-notifications 훅이 처리
      })
      .catch(function(err) {
        console.error('[SW] Re-subscription failed:', err);
      })
  );
});
