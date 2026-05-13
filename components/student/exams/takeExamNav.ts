type MinimalRouter = { back: () => void; push: (href: string) => void };

export function navigateTakeExamExit(router: MinimalRouter, backHref: string): void {
  if (typeof window !== 'undefined') {
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).origin === window.location.origin) {
        router.back();
        return;
      }
    } catch {
      /* ignore */
    }
  }
  router.push(backHref);
}
