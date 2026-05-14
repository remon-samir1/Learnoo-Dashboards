/**
 * Where to send the user after login/register once `token` + user cookies are set.
 * New accounts often return `role: "Unknown"` until the backend assigns a role — still land in app shell.
 */
export function getPostAuthHref(locale: string, role: string | null | undefined): string {
  const r = role?.trim();
  if (r === 'Admin') return '/dashboard';
  if (r === 'Doctor') return '/doctor/dashboard';
  if (r === 'Student') return `/${locale}/student`;
  return '/dashboard';
}
