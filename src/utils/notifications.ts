export async function checkNotificationPermission(): Promise<boolean> {
  if (Notification.permission === 'denied') {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  return (await Notification.requestPermission()) === 'granted';
}
