import { useEffect, useState } from "react";

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
  isReady: boolean;
  formatted: string;
}

export function useCountdown(
  targetIsoDate?: string | null,
  options?: {
    dayLabel?: string;
  }
): CountdownResult {
  const [result, setResult] = useState<CountdownResult>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    isPast: false,
    isReady: false,
    formatted: "--:--:--",
  });

  useEffect(() => {
    if (!targetIsoDate) {
      setResult((prev) => ({
        ...prev,
        isPast: true,
        isReady: true,
        formatted: "00:00:00",
      }));
      return;
    }

    const calculate = () => {
      const targetTime = new Date(targetIsoDate).getTime();
      if (Number.isNaN(targetTime)) {
        setResult({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isPast: true,
          isReady: true,
          formatted: "00:00:00",
        });
        return;
      }

      const now = Date.now();
      const diffSeconds = Math.floor((targetTime - now) / 1000);

      if (diffSeconds <= 0) {
        setResult({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          isPast: true,
          isReady: true,
          formatted: "00:00:00",
        });
        return;
      }

      const days = Math.floor(diffSeconds / 86400);
      const hours = Math.floor((diffSeconds % 86400) / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      const pad = (n: number) => n.toString().padStart(2, "0");
      const daySuffix = options?.dayLabel ? ` ${options.dayLabel} ` : "d ";
      const formatted =
        days > 0
          ? `${days}${daySuffix}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

      setResult({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds: diffSeconds,
        isPast: false,
        isReady: true,
        formatted,
      });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetIsoDate, options?.dayLabel]);

  return result;
}
