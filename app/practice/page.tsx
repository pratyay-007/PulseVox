"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Topic, TopicGenre, REQUIRED_GENRES } from "@/lib/topics";
import { HistorySession } from "@/lib/history";
import { NEW_SESSION_EVENT } from "@/components/SessionBar";
import GenrePicker from "@/components/GenrePicker";
import SlotReel from "@/components/SlotReel";
import TimerSetup from "@/components/TimerSetup";
import PrepScreen from "@/components/PrepScreen";
import SpeakingScreen from "@/components/SpeakingScreen";
import AnalysingScreen from "@/components/AnalysingScreen";
import Results from "@/components/Results";
import styles from "./page.module.css";

export type PracticeStage =
  | "genres"
  | "spin"
  | "timers"
  | "prep"
  | "speaking"
  | "analysing"
  | "results";

const STAGE_LABELS: Record<PracticeStage, string> = {
  genres: "> choose genres",
  spin: "> choose topic",
  timers: "> set timers",
  prep: "> prepare",
  speaking: "> speak",
  analysing: "> results",
  results: "> results",
};

function PracticeContent() {
  const [stage, setStage] = useState<PracticeStage>("genres");
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [selectedGenres, setSelectedGenres] = useState<TopicGenre[]>([...REQUIRED_GENRES]);
  const [chosenTopic, setChosenTopic] = useState<Topic | null>(null);
  const [prepSeconds, setPrepSeconds] = useState<number>(300);
  const [speakingSeconds, setSpeakingSeconds] = useState<number>(180);

  // Completed session payload for results
  const [analysisResult, setAnalysisResult] = useState<HistorySession | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);

  // Auto-reset to a fresh session
  const handleNewSession = useCallback(() => {
    setChosenTopic(null);
    setRecordedAudioBlob(null);
    setAnalysisResult(null);
    setStage("genres");
  }, []);

  // Listen for the custom new-session event (e.g. from SessionBar)
  useEffect(() => {
    const handler = () => handleNewSession();
    window.addEventListener(NEW_SESSION_EVENT, handler);
    return () => window.removeEventListener(NEW_SESSION_EVENT, handler);
  }, [handleNewSession]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/topics");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!active) return;
        if (Array.isArray(data.topics) && data.topics.length > 0) {
          setAllTopics(data.topics);
        } else {
          throw new Error("No topics available");
        }
      } catch (err) {
        if (active) {
          setTopicsError(err instanceof Error ? err.message : "Failed to load topics");
        }
      } finally {
        if (active) {
          setLoadingTopics(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleRetryTopics = async () => {
    setLoadingTopics(true);
    setTopicsError(null);
    try {
      const res = await fetch("/api/topics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.topics) && data.topics.length > 0) {
        setAllTopics(data.topics);
      } else {
        throw new Error("No topics available");
      }
    } catch (err) {
      setTopicsError(err instanceof Error ? err.message : "Failed to load topics");
    } finally {
      setLoadingTopics(false);
    }
  };

  const filteredPool = allTopics.filter((t) => selectedGenres.includes(t.genre));

  const handleGenresSubmitted = () => {
    if (selectedGenres.length > 0) {
      setStage("spin");
    }
  };

  const handleTopicSelected = (topic: Topic) => {
    setChosenTopic(topic);
    setStage("timers");
  };

  const handleTimersConfirmed = (prepSec: number, speakSec: number) => {
    setPrepSeconds(prepSec);
    setSpeakingSeconds(speakSec);
    setStage("prep");
  };

  const handlePrepFinished = () => {
    setStage("speaking");
  };

  const handleSpeakingFinished = (audioBlob: Blob) => {
    setRecordedAudioBlob(audioBlob);
    setStage("analysing");
  };

  const handleAnalysisSuccess = (result: HistorySession) => {
    setAnalysisResult(result);
    setStage("results");
  };

  return (
    <div className={styles.container}>
      <section className={styles.stepRow} aria-label="Practice Step">
        <h2 className={styles.gutter} aria-live="polite">
          {STAGE_LABELS[stage]}
        </h2>

        <div className={styles.output}>
          {/* 1. Genres Screen */}
          {stage === "genres" && (
            <GenrePicker
              selectedGenres={selectedGenres}
              onChange={setSelectedGenres}
              onSubmit={handleGenresSubmitted}
            />
          )}

          {/* 2. Topic Slot Reel Screen */}
          {stage === "spin" && (
            <>
              {loadingTopics ? (
                <p className={styles.loadingState}>loading today&apos;s topics…</p>
              ) : topicsError ? (
                <div className={styles.errorState}>
                  <p>! Error loading topics: {topicsError}</p>
                  <button type="button" onClick={handleRetryTopics} className={styles.retryBtn}>
                    [ retry ]
                  </button>
                </div>
              ) : (
                <SlotReel
                  pool={filteredPool}
                  selectedGenres={selectedGenres}
                  onChangeGenres={() => setStage("genres")}
                  onSelectTopic={handleTopicSelected}
                />
              )}
            </>
          )}

          {/* 3. Timers Screen */}
          {stage === "timers" && chosenTopic && (
            <TimerSetup topic={chosenTopic} onStartPrep={handleTimersConfirmed} />
          )}

          {/* 4. Prep Screen (Phase 8) */}
          {stage === "prep" && chosenTopic && (
            <PrepScreen
              topic={chosenTopic}
              prepSeconds={prepSeconds}
              onFinishPrep={handlePrepFinished}
            />
          )}

          {/* 5. Speaking Screen (Phase 8) */}
          {stage === "speaking" && chosenTopic && (
            <SpeakingScreen
              topic={chosenTopic}
              speakingSeconds={speakingSeconds}
              onFinishSpeaking={handleSpeakingFinished}
            />
          )}

          {/* 6. Analysing Screen (Phase 10) */}
          {stage === "analysing" && chosenTopic && recordedAudioBlob && (
            <AnalysingScreen
              topic={chosenTopic}
              audioBlob={recordedAudioBlob}
              durationSec={speakingSeconds}
              onSuccess={handleAnalysisSuccess}
              onErrorRetry={() => setStage("speaking")}
            />
          )}

          {/* 7. Results Screen (Phase 10) */}
          {stage === "results" && analysisResult && (
            <Results result={analysisResult} onNewSession={handleNewSession} />
          )}
        </div>

        {/* Right-side spacer to keep .output perfectly centered */}
        <div className={styles.gutterSpacer} aria-hidden="true" />
      </section>
    </div>
  );
}

function PracticeWrapper() {
  const searchParams = useSearchParams();
  // Whenever ?reset=1 changes or mounts, key remounts with fresh initial state
  const resetKey = searchParams.get("reset") || "default";

  return <PracticeContent key={resetKey} />;
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.loadingState}>loading practice session…</div>
        </div>
      }
    >
      <PracticeWrapper />
    </Suspense>
  );
}
