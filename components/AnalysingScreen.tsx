"use client";

import { useEffect, useState, useRef } from "react";
import { Topic } from "@/lib/topics";
import { saveSessionToHistory, HistorySession } from "@/lib/history";
import { REFRESH_USAGE_EVENT } from "./SessionBar";
import styles from "./AnalysingScreen.module.css";

interface AnalysingScreenProps {
  topic: Topic;
  audioBlob: Blob;
  durationSec: number;
  onSuccess: (result: HistorySession) => void;
  onErrorRetry: () => void;
}

type RealStage = "sending" | "transcribing" | "analysing" | "done" | "error";

export default function AnalysingScreen({
  topic,
  audioBlob,
  durationSec,
  onSuccess,
  onErrorRetry,
}: AnalysingScreenProps) {
  const [currentStage, setCurrentStage] = useState<RealStage>("sending");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasStartedRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    async function runPipeline() {
      setCurrentStage("sending");
      setErrorMsg(null);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "speech.webm");
        formData.append("durationSec", String(durationSec));
        formData.append("topicTitle", topic.title);

        const res = await fetch("/api/session/analyze", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        if (!res.body) {
          throw new Error("No response body received from server");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const event = JSON.parse(trimmed);

              if (event.stage === "transcribing") {
                setCurrentStage("transcribing");
              } else if (event.stage === "analysing") {
                setCurrentStage("analysing");
              } else if (event.stage === "error") {
                setCurrentStage("error");
                setErrorMsg(event.error || "An error occurred during analysis.");
                return;
              } else if (event.stage === "done" && event.result) {
                setCurrentStage("done");
                // Save session to localStorage
                saveSessionToHistory(event.result);
                // Dispatch event so SessionBar updates remaining trials count immediately
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event(REFRESH_USAGE_EVENT));
                }
                onSuccess(event.result);
                return;
              }
            } catch {
              // Ignore non-JSON line
            }
          }
        }
      } catch (err) {
        setCurrentStage("error");
        setErrorMsg(err instanceof Error ? err.message : "Network failure connecting to analyzer.");
      }
    }

    runPipeline();
  }, [audioBlob, durationSec, topic.title, onSuccess]);

  const stages: { key: "sending" | "transcribing" | "analysing"; label: string }[] = [
    { key: "sending", label: "sending audio" },
    { key: "transcribing", label: "transcribing" },
    { key: "analysing", label: "analysing" },
  ];

  const getStageStatus = (key: "sending" | "transcribing" | "analysing") => {
    if (currentStage === "error") {
      return "pending";
    }
    if (currentStage === "done") {
      return "done";
    }
    const order = ["sending", "transcribing", "analysing"];
    const currentIdx = order.indexOf(currentStage);
    const thisIdx = order.indexOf(key);

    if (thisIdx < currentIdx) return "done";
    if (thisIdx === currentIdx) return "active";
    return "pending";
  };

  return (
    <div className={styles.container}>
      <div className={styles.stagesList} role="status" aria-live="polite">
        {stages.map((s) => {
          const status = getStageStatus(s.key);
          const marker = status === "done" ? "x" : status === "active" ? ">" : "-";
          const statusClass =
            status === "done"
              ? styles.stageDone
              : status === "active"
              ? styles.stageActive
              : styles.stagePending;

          return (
            <div key={s.key} className={`${styles.stageRow} ${statusClass}`}>
              <span className={styles.stageMarker} aria-hidden="true">
                {marker}
              </span>
              <span className={styles.stageLabel}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {currentStage === "error" && errorMsg && (
        <div className={styles.errorBox} role="alert">
          <p className={styles.errorMessage}>! {errorMsg}</p>
          <button type="button" onClick={onErrorRetry} className={styles.retryBtn}>
            [ try again ]
          </button>
        </div>
      )}
    </div>
  );
}
