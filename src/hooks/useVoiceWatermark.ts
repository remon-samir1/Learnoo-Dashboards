import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';

export interface UseVoiceWatermarkProps {
  /** Whether voice watermark is enabled */
  enabled: boolean;
  /** Text to speak as watermark */
  text: string;
  /** Interval in seconds between speech utterances */
  interval: number;
  /** Reference to the video element (optional - if null, speaks continuously when enabled) */
  videoRef?: RefObject<HTMLVideoElement | null>;
}

/**
 * Hook for voice watermark functionality using Web Speech API.
 * 
 * Speaks the watermark text at the configured interval when:
 * - Voice watermark is enabled
 * - Watermark text is not empty
 * - Video is playing (if videoRef provided)
 * - Tab is visible
 * 
 * Automatically stops when:
 * - Video is paused (if videoRef provided)
 * - Video ends (if videoRef provided)
 * - User leaves the page
 * - Component unmounts
 * - Settings change
 * 
 * If videoRef is null or undefined, the voice watermark will speak continuously
 * at the interval when enabled (useful for live sessions without video elements).
 * 
 * @param props - Configuration for voice watermark
 */
export function useVoiceWatermark({
  enabled,
  text,
  interval,
  videoRef,
}: UseVoiceWatermarkProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<boolean>(true);
  const isPlayingRef = useRef<boolean>(false);
  const previousSettingsRef = useRef<string>(JSON.stringify({ enabled, text, interval, hasVideo: !!videoRef }));

  // Speak the watermark text
  const speak = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Guard against browser API not being available
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    const synthesis = window.speechSynthesis;

    // Don't start if already speaking to avoid overlapping speech
    if (synthesis.speaking) {
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(trimmedText);
      utterance.volume = 0.5; // Moderate volume
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0; // Normal pitch

      synthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to speak watermark text:', error);
    }
  }, [text]);

  // Start the interval timer
  const startInterval = useCallback(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start if conditions aren't met
    if (!enabled || !text.trim() || interval <= 0) {
      return;
    }

    // Speak immediately, then start interval
    speak();

    intervalRef.current = setInterval(() => {
      speak();
    }, interval * 1000); // Convert seconds to milliseconds
  }, [enabled, text, interval, speak]);

  // Stop the interval timer
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Also cancel any ongoing speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Handle video play event
  const handlePlay = useCallback(() => {
    isPlayingRef.current = true;
    if (visibilityRef.current && enabled && text.trim()) {
      startInterval();
    }
  }, [enabled, text, startInterval]);

  // Handle video pause event
  const handlePause = useCallback(() => {
    isPlayingRef.current = false;
    stopInterval();
  }, [stopInterval]);

  // Handle video ended event
  const handleEnded = useCallback(() => {
    isPlayingRef.current = false;
    stopInterval();
  }, [stopInterval]);

  // Handle visibility change (tab hidden/shown)
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    visibilityRef.current = isVisible;

    const shouldSpeak = videoRef
      ? (isVisible && isPlayingRef.current && enabled && text.trim())
      : (isVisible && enabled && text.trim());

    if (shouldSpeak) {
      startInterval();
    } else {
      stopInterval();
    }
  }, [enabled, text, videoRef, startInterval, stopInterval]);

  // Handle page unload
  const handleBeforeUnload = useCallback(() => {
    stopInterval();
  }, [stopInterval]);

  // Main effect for setting up event listeners and managing lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const video = videoRef?.current ?? null;
    const hasVideoElement = video !== null;

    // Check if settings have changed
    const currentSettings = JSON.stringify({ enabled, text, interval, hasVideo: hasVideoElement });
    if (previousSettingsRef.current !== currentSettings) {
      previousSettingsRef.current = currentSettings;

      // Restart with new settings
      if (hasVideoElement) {
        // Video-based: only if video is playing
        if (!video.paused && enabled && text.trim()) {
          stopInterval();
          startInterval();
        } else {
          stopInterval();
        }
      } else {
        // No video: just check enabled state
        if (enabled && text.trim() && !document.hidden) {
          stopInterval();
          startInterval();
        } else {
          stopInterval();
        }
      }
    }

    // Add event listeners if we have a video element
    if (hasVideoElement) {
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);

      // Check initial state
      if (!video.paused && enabled && text.trim() && !document.hidden) {
        isPlayingRef.current = true;
        startInterval();
      }
    } else {
      // No video element - start immediately if enabled
      if (enabled && text.trim() && !document.hidden) {
        isPlayingRef.current = true;
        startInterval();
      }
    }

    // Always add visibility and unload listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      if (hasVideoElement && video) {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopInterval();
    };
  }, [
    enabled,
    text,
    interval,
    videoRef,
    handlePlay,
    handlePause,
    handleEnded,
    handleVisibilityChange,
    handleBeforeUnload,
    startInterval,
    stopInterval,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopInterval();
    };
  }, [stopInterval]);
}
