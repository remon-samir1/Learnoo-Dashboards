import Cookies from 'js-cookie';

export function getDeviceId(): string {
  const stored = Cookies.get('learnoo_device_id') || localStorage.getItem('learnoo_device_id');
  const id = stored && stored.length >= 16 && stored.length <= 255 ? stored : crypto.randomUUID();
  Cookies.set('learnoo_device_id', id, {
    expires: 730,
    path: '/',
    sameSite: 'lax',
    secure: location.protocol === 'https:',
    ...(location.hostname === 'learnoo.app' || location.hostname.endsWith('.learnoo.app') ? { domain: '.learnoo.app' } : {}),
  });
  localStorage.setItem('learnoo_device_id', id);
  return id;
}
