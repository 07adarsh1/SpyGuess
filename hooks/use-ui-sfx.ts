"use client";

import { useCallback } from "react";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  return audioContext;
}

export function useUiSfx() {
  return useCallback((variant: "soft" | "bright" = "soft") => {
    const context = getAudioContext();

    if (!context) {
      return;
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = variant === "bright" ? 780 : 520;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.13);
  }, []);
}
