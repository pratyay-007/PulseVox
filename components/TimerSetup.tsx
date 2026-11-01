"use client";

import { useState } from "react";
import { Topic } from "@/lib/topics";
import styles from "./TimerSetup.module.css";

interface TimerSetupProps {
  topic: Topic;
  onStartPrep: (prepSeconds: number, speakingSeconds: number) => void;
}

export default function TimerSetup({ topic, onStartPrep }: TimerSetupProps) {
  const isDevShort = process.env.NEXT_PUBLIC_DEV_SHORT_TIMERS === "true";

  // In standard mode: prep in minutes (5-15, default 5), speaking in minutes (2-5, default 3)
  // In dev short mode: can be set to 10 seconds
  const [prepMinutes, setPrepMinutes] = useState<number>(5);
  const [speakingMinutes, setSpeakingMinutes] = useState<number>(3);
  const [use10sTimers, setUse10sTimers] = useState<boolean>(false);

  const handleStart = () => {
    if (isDevShort && use10sTimers) {
      onStartPrep(10, 10);
    } else {
      onStartPrep(prepMinutes * 60, speakingMinutes * 60);
    }
  };

  const prepSummaryText = isDevShort && use10sTimers ? "10 seconds" : `${prepMinutes} min`;
  const speakSummaryText = isDevShort && use10sTimers ? "10 seconds" : `${speakingMinutes} min`;

  return (
    <div className={styles.container}>
      <div className={styles.topicSnippet}>
        <h3 className={styles.topicTitle}>{topic.title}</h3>
        <span className={styles.topicMeta}>
          [{topic.genre}] · {topic.type} · {topic.difficulty}
        </span>
      </div>

      {isDevShort && (
        <div style={{ display: "flex", alignItems: "center", gap: "1ch" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "1ch", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={use10sTimers}
              onChange={(e) => setUse10sTimers(e.target.checked)}
            />
            <span>Enable 10-second timers for quick testing</span>
          </label>
          <span className={styles.devBadge}>DEV_SHORT_TIMERS</span>
        </div>
      )}

      {(!isDevShort || !use10sTimers) && (
        <div className={styles.timersList}>
          {/* Prep Time Row */}
          <div className={styles.timerRow}>
            <div className={styles.timerLabelRow}>
              <label htmlFor="prep-time-range" className={styles.timerLabel}>
                prep time:
              </label>
              <span className={styles.timerValue}>{prepMinutes} min</span>
            </div>
            <input
              id="prep-time-range"
              type="range"
              min={5}
              max={15}
              step={1}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(parseInt(e.target.value, 10))}
              className={styles.rangeInput}
              aria-valuemin={5}
              aria-valuemax={15}
              aria-valuenow={prepMinutes}
              aria-valuetext={`${prepMinutes} minutes`}
            />
          </div>

          {/* Speaking Time Row */}
          <div className={styles.timerRow}>
            <div className={styles.timerLabelRow}>
              <label htmlFor="speaking-time-range" className={styles.timerLabel}>
                speaking time:
              </label>
              <span className={styles.timerValue}>{speakingMinutes} min</span>
            </div>
            <input
              id="speaking-time-range"
              type="range"
              min={2}
              max={5}
              step={1}
              value={speakingMinutes}
              onChange={(e) => setSpeakingMinutes(parseInt(e.target.value, 10))}
              className={styles.rangeInput}
              aria-valuemin={2}
              aria-valuemax={5}
              aria-valuenow={speakingMinutes}
              aria-valuetext={`${speakingMinutes} minutes`}
            />
          </div>
        </div>
      )}

      <p className={styles.summaryLine}>
        you will have {prepSummaryText} to prepare, then speak for {speakSummaryText}.
      </p>

      <div className={styles.actions}>
        <button type="button" onClick={handleStart} className={styles.primaryBtn}>
          [ begin preparing ]
        </button>
      </div>
    </div>
  );
}

