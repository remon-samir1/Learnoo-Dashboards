'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function LiveMeetingStage({ children, chatOpen = false }: { children: ReactNode; chatOpen?: boolean }) {
  const width = chatOpen ? 1275 : 960;
  const container = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = container.current!;
    const resize = () => setScale(Math.min(element.clientWidth / width, element.clientHeight / 640));
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, [width]);

  // Keep the same canvas coordinates on every device; scale the whole meeting to fit.
  return <div ref={container} className="relative h-full w-full overflow-hidden bg-[#040404]">
    <div className="absolute" style={{ width, height: 640, left: '50%', top: '50%', zoom: scale || 1, transform: 'translate(-50%, -50%)', visibility: scale ? 'visible' : 'hidden' }}>
      {children}
    </div>
  </div>;
}
