"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Topic, TopicGenre } from "@/lib/topics";
import styles from "./SlotReel.module.css";

interface SlotReelProps {
  pool: Topic[];
  selectedGenres: TopicGenre[];
  onChangeGenres: () => void;
  onSelectTopic: (topic: Topic) => void;
}

const ROW_HEIGHT = 64;
const PAYLINE_ROW_INDEX = 2; // Center row: 0, 1, [2], 3, 4

// Easing function for slot machine: rapid burst followed by smooth deceleration
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

// Interleave topics across genres so adjacent topics always belong to different genres
function interleaveGenres(topics: Topic[]): Topic[] {
  if (topics.length <= 1) return topics;

  // Group topics by genre
  const byGenre: Record<string, Topic[]> = {};
  for (const t of topics) {
    if (!byGenre[t.genre]) byGenre[t.genre] = [];
    byGenre[t.genre].push(t);
  }

  // Shuffle within each genre list
  const genres = Object.keys(byGenre);
  for (let i = genres.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [genres[i], genres[j]] = [genres[j], genres[i]];
  }

  for (const g of genres) {
    const list = byGenre[g];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  // Interleave round-robin across genres
  const interleaved: Topic[] = [];
  let maxLen = 0;
  for (const g of genres) {
    if (byGenre[g].length > maxLen) maxLen = byGenre[g].length;
  }

  for (let i = 0; i < maxLen; i++) {
    for (const g of genres) {
      if (i < byGenre[g].length) {
        interleaved.push(byGenre[g][i]);
      }
    }
  }

  return interleaved;
}

export default function SlotReel({
  pool,
  selectedGenres,
  onChangeGenres,
  onSelectTopic,
}: SlotReelProps) {
  // First interleave genres so topics alternate randomly across genres
  const interleavedPool = useMemo(() => {
    return interleaveGenres(pool);
  }, [pool]);

  // Repeat pool so the reel has at least 120 items for seamless spinning & scrolling
  const displayList = useMemo(() => {
    if (interleavedPool.length === 0) return [];
    const repeatCount = Math.max(4, Math.ceil(120 / interleavedPool.length));
    return Array.from({ length: repeatCount }, () => interleavedPool).flat();
  }, [interleavedPool]);

  // Store chosen topic when user clicks or spins.
  const [chosenTopic, setChosenTopic] = useState<Topic | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const useTopicBtnRef = useRef<HTMLButtonElement>(null);
  const previousTopicIdRef = useRef<string | null>(null);
  const initialMountDoneRef = useRef<boolean>(false);

  // Active topic is chosen topic, or defaults immediately to the first of the interleaved list
  const activeTopic = useMemo(() => {
    if (chosenTopic && interleavedPool.some((t) => t.id === chosenTopic.id)) {
      return chosenTopic;
    }
    return interleavedPool.length > 0 ? interleavedPool[0] : null;
  }, [chosenTopic, interleavedPool]);

  // Initial scroll position alignment
  useEffect(() => {
    if (displayList.length === 0 || !activeTopic) return;

    if (!initialMountDoneRef.current) {
      initialMountDoneRef.current = true;
      const container = scrollContainerRef.current;
      if (!container) return;

      const foundIdx = displayList.findIndex((t) => t.id === activeTopic.id);
      if (foundIdx !== -1) {
        const targetScroll = Math.max(0, (foundIdx - PAYLINE_ROW_INDEX) * ROW_HEIGHT);
        container.scrollTop = targetScroll;
      }
    }
  }, [displayList, activeTopic]);

  // Spin to a specific index in the displayList
  const animateSpinTo = useCallback(
    (targetIdx: number, targetTopic: Topic) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      setIsSpinning(true);
      setAnnouncement("Shuffling topics…");

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const targetScroll = Math.max(0, (targetIdx - PAYLINE_ROW_INDEX) * ROW_HEIGHT);

      if (prefersReducedMotion) {
        container.scrollTop = targetScroll;
        setSelectedIndex(targetIdx);
        setChosenTopic(targetTopic);
        previousTopicIdRef.current = targetTopic.id;
        setIsSpinning(false);
        setAnnouncement(
          `Topic selected: ${targetTopic.title}. ${targetTopic.type}, ${targetTopic.difficulty}.`
        );
        useTopicBtnRef.current?.focus();
        return;
      }

      const startScroll = container.scrollTop;
      const distance = targetScroll - startScroll;
      const durationMs = 2400; // 2.4 seconds of crisp slot machine deceleration
      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeOutQuart(progress);

        container.scrollTop = startScroll + distance * eased;

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          container.scrollTop = targetScroll;
          setSelectedIndex(targetIdx);
          setChosenTopic(targetTopic);
          previousTopicIdRef.current = targetTopic.id;
          setIsSpinning(false);
          setAnnouncement(
            `Topic selected: ${targetTopic.title}. ${targetTopic.type}, ${targetTopic.difficulty}.`
          );
          useTopicBtnRef.current?.focus();
        }
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(step);
    },
    []
  );

  // Trigger random spin
  const startSpin = useCallback(() => {
    if (interleavedPool.length === 0 || isSpinning || displayList.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Pick random target topic (different from previous if pool > 1)
    const candidates =
      interleavedPool.length > 1
        ? interleavedPool.filter((t) => t.id !== previousTopicIdRef.current)
        : interleavedPool;
    const targetTopic =
      candidates[Math.floor(Math.random() * candidates.length)] || interleavedPool[0];

    // Current scroll position
    let currentScroll = container.scrollTop;
    const loopHeight = interleavedPool.length * ROW_HEIGHT;

    // If we've scrolled past 2 full repetitions, normalize scroll back seamlessly
    if (currentScroll > loopHeight * 2) {
      const loops = Math.floor(currentScroll / loopHeight);
      currentScroll = currentScroll - loops * loopHeight;
      container.scrollTop = currentScroll;
    }

    const currentPaylineIdx = Math.round(currentScroll / ROW_HEIGHT) + PAYLINE_ROW_INDEX;

    // Target must be 25 to 40 rows ahead for a satisfying spin
    const minTargetIdx = currentPaylineIdx + 25;

    let targetIdx = -1;
    for (let i = minTargetIdx; i < displayList.length; i++) {
      if (displayList[i].id === targetTopic.id) {
        targetIdx = i;
        break;
      }
    }

    // Fallback if not found ahead
    if (targetIdx === -1) {
      targetIdx = Math.min(displayList.length - 3, minTargetIdx);
    }

    animateSpinTo(targetIdx, displayList[targetIdx] || targetTopic);
  }, [interleavedPool, isSpinning, displayList, animateSpinTo]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // User manually clicks on any row in the list
  const handleRowClick = (topic: Topic, idx: number) => {
    if (isSpinning) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    setSelectedIndex(idx);
    setChosenTopic(topic);
    previousTopicIdRef.current = topic.id;
    setAnnouncement(
      `Topic selected: ${topic.title}. ${topic.type}, ${topic.difficulty}.`
    );

    // Smoothly scroll clicked row into center payline
    const targetScroll = Math.max(0, (idx - PAYLINE_ROW_INDEX) * ROW_HEIGHT);
    container.scrollTo({ top: targetScroll, behavior: "smooth" });
  };

  return (
    <div className={styles.container}>
      {/* Live Region for Screen Readers */}
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      {/* Genres summary header */}
      <div className={styles.summaryHeader}>
        <span className={styles.genreSummary}>
          genres:{" "}
          {selectedGenres.length === 10
            ? "all 10 genres"
            : selectedGenres.join(", ")}
        </span>
        <button
          type="button"
          onClick={onChangeGenres}
          className={styles.changeGenresBtn}
          disabled={isSpinning}
        >
          [ change genres ]
        </button>
      </div>

      {/* Unified Reel Box (Slot machine spin + smooth user scrolling & clicking) */}
      <div className={styles.windowWrapper}>
        <div
          ref={scrollContainerRef}
          className={`${styles.scrollArea} ${isSpinning ? styles.isSpinning : ""}`}
          role="listbox"
          aria-label="Topics slot reel. Use mouse to scroll or click any topic to choose."
        >
          {displayList.map((topic, idx) => {
            const isSelected =
              selectedIndex === idx ||
              (selectedIndex === null && activeTopic?.id === topic.id);

            return (
              <div
                key={`${topic.id}-${idx}`}
                className={`${styles.reelRow} ${isSelected ? styles.selectedRow : ""}`}
                onClick={() => handleRowClick(topic, idx)}
                role="option"
                aria-selected={isSelected}
              >
                {/* Left indicator marker badge */}
                <span
                  className={`${styles.markerBadge} ${isSelected ? styles.markerBadgeActive : ""}`}
                  aria-hidden="true"
                >
                  {isSelected ? ">" : ""}
                </span>

                {/* Genre tag — fully visible, never covered */}
                <span className={styles.genreTag}>[{topic.genre}]</span>

                {/* Topic title — clear and high legibility */}
                <span className={styles.topicTitle}>{topic.title}</span>

                {/* Right indicator marker badge */}
                <span
                  className={`${styles.markerBadgeRight} ${isSelected ? styles.markerBadgeActive : ""}`}
                  aria-hidden="true"
                >
                  {isSelected ? "<" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hint for user: they can scroll or click */}
      <div className={styles.reelHintBar}>
        <span>TIP: CLICK [ SHUFFLE ] TO SPIN · OR SCROLL &amp; CLICK ANY TOPIC ABOVE</span>
      </div>

      {/* Selected Topic Details Card — populated immediately by default */}
      <div className={styles.selectedBlock}>
        {activeTopic ? (
          <>
            <h3 className={styles.selectedTitle}>{activeTopic.title}</h3>
            <span className={styles.selectedMeta}>
              type: {activeTopic.type} · difficulty: {activeTopic.difficulty}
            </span>
            <div className={styles.hintsList}>
              {activeTopic.hints.map((hint, i) => (
                <p key={i} className={styles.hintItem}>
                  - {hint}
                </p>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.hintItem} aria-hidden="true">
            {isSpinning
              ? "Shuffling topics…"
              : "Loading topics…"}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={startSpin}
          disabled={isSpinning}
          className={styles.secondaryBtn}
        >
          {isSpinning ? "[ shuffling… ]" : "[ shuffle ]"}
        </button>
        <button
          ref={useTopicBtnRef}
          type="button"
          onClick={() => activeTopic && onSelectTopic(activeTopic)}
          disabled={isSpinning || !activeTopic}
          className={styles.primaryBtn}
        >
          [ use this topic ]
        </button>
      </div>
    </div>
  );
}
