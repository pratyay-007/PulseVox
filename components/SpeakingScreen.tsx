"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Topic } from "@/lib/topics";
import styles from "./SpeakingScreen.module.css";

interface SpeakingScreenProps {
  topic: Topic;
  speakingSeconds: number;
  onFinishSpeaking: (audioBlob: Blob) => void;
}

export default function SpeakingScreen({
  topic,
  speakingSeconds,
  onFinishSpeaking,
}: SpeakingScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(speakingSeconds);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number>(0);
  const hasFinishedRef = useRef<boolean>(false);

  // Warn before accidental page unload during recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
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

  const finishRecording = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      cleanupAudio();
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      onFinishSpeaking(blob);
    }
  }, [cleanupAudio, onFinishSpeaking]);

  useEffect(() => {
    let isMounted = true;

    async function initRecorder() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        audioStreamRef.current = stream;

        // Level analyzer
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const avg = sum / bufferLength;
          setAudioLevel(Math.min(10, Math.floor((avg / 60) * 10)));
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();

        // Select best supported MIME type
        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
        ];
        const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || "";

        const recorderOptions: MediaRecorderOptions = {
          audioBitsPerSecond: 32000, // ~32 kbps to keep uploads small & within limits
        };
        if (selectedMime) {
          recorderOptions.mimeType = selectedMime;
        }

        const recorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          cleanupAudio();
          const finalMime = recorder.mimeType || "audio/webm";
          const blob = new Blob(audioChunksRef.current, { type: finalMime });
          onFinishSpeaking(blob);
        };

        startTimeRef.current = Date.now();
        endTimeRef.current = startTimeRef.current + speakingSeconds * 1000;
        recorder.start(250); // Collect in 250ms chunks
      } catch (err: unknown) {
        const error = err as { message?: string };
        setErrorMessage(error.message || "Failed to start audio recording.");
      }
    }

    initRecorder();

    return () => {
      isMounted = false;
      cleanupAudio();
    };
  }, [speakingSeconds, cleanupAudio, onFinishSpeaking]);

  // Timestamp-based countdown & elapsed timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (startTimeRef.current === 0) return;
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - startTimeRef.current) / 1000));
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

      setElapsedSeconds(elapsed);
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timerInterval);
        finishRecording();
      }
    }, 250);

    return () => clearInterval(timerInterval);
  }, [finishRecording]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const canFinishEarly = elapsedSeconds >= 30;

  // Real character audio level meter: [||||······]
  const filledSlots = Math.min(10, Math.max(0, audioLevel));
  const emptySlots = 10 - filledSlots;
  const meterText = `[${"|".repeat(filledSlots)}${"·".repeat(emptySlots)}]`;

  return (
    <div className={styles.container}>
      <div className={styles.topicSection}>
        <h3 className={styles.topicTitle}>{topic.title}</h3>
        <div className={styles.hintsList}>
          {topic.hints.map((hint, i) => (
            <p key={i} className={styles.hintItem}>
              - {hint}
            </p>
          ))}
        </div>
      </div>

      <div className={styles.statusRow}>
        <span className={styles.recordingBadge} role="status">
          ● RECORDING
        </span>
      </div>

      <div className={styles.timeRow}>
        <div className={styles.timeBlock}>
          <span className={styles.timeLabel}>elapsed:</span>
          <span className={styles.timeValue}>{formatTime(elapsedSeconds)}</span>
        </div>
        <div className={styles.timeBlock}>
          <span className={styles.timeLabel}>remaining:</span>
          <span className={styles.timeValue}>{formatTime(remainingSeconds)}</span>
        </div>
      </div>

      <div className={styles.meterRow}>
        <span className={styles.meterLabel}>input level:</span>
        <span className={styles.meterBar} aria-label={`Input level ${audioLevel} of 10`}>
          {meterText}
        </span>
      </div>

      {errorMessage && <p className={styles.errorMessage}>! {errorMessage}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          onClick={finishRecording}
          disabled={!canFinishEarly}
          className={styles.finishBtn}
        >
          [ finish early ]
        </button>
        {!canFinishEarly && (
          <span className={styles.finishHint}>
            available after 0:30 (elapsed {formatTime(elapsedSeconds)})
          </span>
        )}
      </div>
    </div>
  );
}
