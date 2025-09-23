import { supabase } from './supabaseClient';

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function handleNotificationPermission(): Promise<void> {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      try {
        console.log('Waiting for service worker to be ready...');
        const registration = await navigator.serviceWorker.ready;
        console.log('Service worker is ready!');

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        console.log('Push subscription successful:', subscription);

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase.from('push_subscriptions')
            .insert([{ subscription: subscription, user_id: user.id }]);
          if (error) {
            console.error('Failed to save push subscription:', error);
          } else {
            console.log('Saved push subscription to database!')
          }
        }

      } catch (error) {
        console.error('Push subscription failed:', error);
      }
    }
  }
}