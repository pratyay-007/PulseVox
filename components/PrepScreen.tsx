"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Topic } from "@/lib/topics";
import styles from "./PrepScreen.module.css";

interface PrepScreenProps {
  topic: Topic;
  prepSeconds: number;
  onFinishPrep: () => void;
}

export default function PrepScreen({ topic, prepSeconds, onFinishPrep }: PrepScreenProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(prepSeconds);
  const [notes, setNotes] = useState<string>("");
  const [micStatus, setMicStatus] = useState<"idle" | "requesting" | "ready" | "error">("requesting");
  const [micErrorMsg, setMicErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 10
  const [announcement, setAnnouncement] = useState<string>("");

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);
  const announcedMilestonesRef = useRef<Set<number>>(new Set());

  // Prevent accidental page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Request microphone permission & set up audio level meter
  const startMicCheck = useCallback(async () => {
    setMicErrorMsg(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength; // 0 to 255
        // Scale to 0..10
        const level = Math.min(10, Math.floor((avg / 60) * 10));
        setAudioLevel(level);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
      setMicStatus("ready");
    } catch (err: unknown) {
      setMicStatus("error");
      const error = err as { name?: string; message?: string };
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setMicErrorMsg("Microphone permission denied. Please allow microphone access in browser settings.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setMicErrorMsg("No microphone detected. Please plug in or enable an audio input device.");
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        setMicErrorMsg("Microphone is currently in use by another app or system service.");
      } else {
        setMicErrorMsg(error.message || "Failed to initialize microphone.");
      }
    }
  }, []);

  const cleanupAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startMicCheck();
    }, 0);
    return () => {
      clearTimeout(timer);
      cleanupAudio();
    };
  }, [startMicCheck, cleanupAudio]);

  // Timestamp-based countdown timer
  useEffect(() => {
    endTimeRef.current = Date.now() + prepSeconds * 1000;
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setSecondsRemaining(remaining);

      // Screen reader announcements at key milestones (e.g. 60s, 30s, 10s)
      if (remaining === 60 && !announcedMilestonesRef.current.has(60)) {
        announcedMilestonesRef.current.add(60);
        setAnnouncement("1 minute remaining for preparation.");
      } else if (remaining === 10 && !announcedMilestonesRef.current.has(10)) {
        announcedMilestonesRef.current.add(10);
        setAnnouncement("10 seconds remaining for preparation.");
      }

      if (remaining <= 0) {
        clearInterval(timerInterval);
        cleanupAudio();
        onFinishPrep();
      }
    }, 250);

    return () => clearInterval(timerInterval);
  }, [prepSeconds, cleanupAudio, onFinishPrep]);

  const handleSkip = () => {
    cleanupAudio();
    onFinishPrep();
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Character-based meter: [||||······]
  const filledSlots = Math.min(10, Math.max(0, audioLevel));
  const emptySlots = 10 - filledSlots;
  const meterText = `[${"|".repeat(filledSlots)}${"·".repeat(emptySlots)}]`;

  return (
    <div className={styles.container}>
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      <div className={styles.topicSection}>
        <h3 className={styles.topicTitle}>{topic.title}</h3>
        <div className={styles.hintsList}>
          {topic.hints.map((hint, idx) => (
            <p key={idx} className={styles.hintItem}>
              - {hint}
            </p>
          ))}
        </div>
      </div>

      <div className={styles.timerSection}>
        <span className={styles.timerLabel}>prep time remaining:</span>
        <span className={styles.countdownDisplay} aria-label={`${timeFormatted} remaining`}>
          {timeFormatted}
        </span>
      </div>

      <div className={styles.notesSection}>
        <label htmlFor="prep-notes-textarea" className={styles.notesLabel}>
          your notes (stay in this browser, never uploaded):
        </label>
        <textarea
          id="prep-notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down bullet points, structure, or key vocabulary to guide your speech..."
          className={styles.notesTextarea}
        />
      </div>

      {/* Real Microphone Check Row */}
      <div className={styles.micSection}>
        <div className={styles.micStatusRow}>
          <span className={styles.micStatus}>
            microphone:{" "}
            {micStatus === "ready"
              ? "active"
              : micStatus === "requesting"
              ? "requesting access…"
              : micStatus === "error"
              ? "unavailable"
              : "idle"}
          </span>
          {micStatus === "error" && (
            <button type="button" onClick={startMicCheck} className={styles.retryMicBtn}>
              [ retry microphone ]
            </button>
          )}
        </div>

        {micStatus === "ready" && (
          <div className={styles.micMeterRow}>
            <span className={styles.meterLabel}>input level:</span>
            <span className={styles.meterBar} aria-label={`Input level ${audioLevel} out of 10`}>
              {meterText}
            </span>
            <span className={styles.meterLabel}>speak to test</span>
          </div>
        )}

        {micStatus === "error" && micErrorMsg && (
          <p className={styles.micError}>! {micErrorMsg}</p>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={handleSkip} className={styles.secondaryBtn}>
          [ skip to speaking ]
        </button>
      </div>
    </div>
  );
}
