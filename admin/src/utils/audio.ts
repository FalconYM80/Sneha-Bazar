/**
 * Audio and browser notification utility for Sneha Bazar Admin.
 * Uses Web Audio API to synthesize a clean, subtle chime without external media assets.
 * Respects browser autoplay policies and user mute preferences.
 */

const MUTE_STORAGE_KEY = "sneha_admin_notif_sound_muted";

export const getSoundMuted = (): boolean => {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

export const setSoundMuted = (muted: boolean): void => {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? "true" : "false");
  } catch {}
};

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
};

/**
 * Plays a pleasant, two-tone notification chime (D5 -> A5).
 * Completely safe against autoplay restrictions and muted states.
 */
export const playOrderNotificationSound = (): void => {
  if (getSoundMuted()) {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") {
      return;
    }

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.23);

    // Tone 2: 880 Hz (A5), slight delay for harmonic bell chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.09);
    gain2.gain.setValueAtTime(0, now + 0.09);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.46);
  } catch (err) {
    // Autoplay restrictions or unsupported audio API are handled gracefully
    console.debug("[Audio] Notification sound skipped:", err);
  }
};

/**
 * Request desktop browser notification permission
 */
export const requestDesktopNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
};

/**
 * Trigger an optional desktop browser notification
 */
export const showDesktopNotification = (
  title: string,
  options?: NotificationOptions & { onClick?: () => void }
): void => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  if (Notification.permission !== "granted") {
    return;
  }
  try {
    const { onClick, ...notifOptions } = options || {};
    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...notifOptions,
    });
    if (onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  } catch (err) {
    console.debug("[Desktop Notification] Failed to display:", err);
  }
};
