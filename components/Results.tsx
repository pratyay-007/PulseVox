"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HistorySession } from "@/lib/history";
import styles from "./Results.module.css";

interface ResultsProps {
  result: HistorySession;
  onNewSession: () => void;
}

interface HighlightSpan {
  marker: number;
  original: string;
  start: number;
  end: number;
}

export default function Results({ result, onNewSession }: ResultsProps) {
  const [trialsRemaining, setTrialsRemaining] = useState<number | null>(null);

  useEffect(() => {
    async function checkRemaining() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.remaining === "number") {
            setTrialsRemaining(data.remaining);
          }
        }
      } catch {
        // Ignore
      }
    }
    checkRemaining();
  }, []);

  const { stats, feedback, transcript } = result;

  // Build flagged phrases for transcript highlighting
  // Combine all items with an 'original' quote
  const allCorrections: { original: string; improved: string; reason: string; category: string }[] =
    [];

  feedback.grammar?.forEach((g) => {
    if (g.original) allCorrections.push({ ...g, category: "grammar" });
  });
  feedback.vocabulary?.forEach((v) => {
    if (v.original)
      allCorrections.push({
        original: v.original,
        improved: v.better,
        reason: v.note,
        category: "vocabulary",
      });
  });
  feedback.phrasing?.forEach((p) => {
    if (p.original)
      allCorrections.push({
        original: p.original,
        improved: p.improved,
        reason: p.why,
        category: "phrasing",
      });
  });

  // Find exact quote locations in transcript
  const highlights: HighlightSpan[] = [];
  const lowerTranscript = transcript.toLowerCase();

  allCorrections.forEach((item, idx) => {
    const targetQuote = item.original.trim().toLowerCase();
    if (!targetQuote) return;

    const startIdx = lowerTranscript.indexOf(targetQuote);
    if (startIdx !== -1) {
      // Check for overlap with existing highlight
      const endIdx = startIdx + targetQuote.length;
      const overlaps = highlights.some(
        (h) => (startIdx >= h.start && startIdx < h.end) || (endIdx > h.start && endIdx <= h.end)
      );

      if (!overlaps) {
        highlights.push({
          marker: idx + 1,
          original: item.original,
          start: startIdx,
          end: endIdx,
        });
      }
    }
  });

  highlights.sort((a, b) => a.start - b.start);

  // Render annotated transcript
  const renderAnnotatedTranscript = () => {
    if (highlights.length === 0) {
      return <span>{transcript}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIdx = 0;

    highlights.forEach((h, i) => {
      if (h.start > lastIdx) {
        segments.push(<span key={`text-${i}`}>{transcript.slice(lastIdx, h.start)}</span>);
      }
      segments.push(
        <span key={`highlight-${i}`} className={styles.flaggedPhrase}>
          <sup className={styles.flagMarker}>[{h.marker}]</sup>
          {transcript.slice(h.start, h.end)}
        </span>
      );
      lastIdx = h.end;
    });

    if (lastIdx < transcript.length) {
      segments.push(<span key="tail">{transcript.slice(lastIdx)}</span>);
    }

    return segments;
  };

  const isLimitReached = trialsRemaining !== null && trialsRemaining <= 0;

  return (
    <div className={styles.container}>
      {/* 1. Coaching Summary */}
      <section className={styles.section} aria-labelledby="summary-heading">
        <h3 id="summary-heading" className={styles.sectionTitle}>
          coaching summary
        </h3>
        <p className={styles.summaryText}>{feedback.summary}</p>
      </section>

      {/* 2. Real Speech Stats */}
      <section className={styles.section} aria-labelledby="stats-heading">
        <h3 id="stats-heading" className={styles.sectionTitle}>
          speech metrics
        </h3>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>duration</span>
            <span className={styles.statValue}>{stats.durationSec}s</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>word count</span>
            <span className={styles.statValue}>{stats.wordCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>pace</span>
            <span className={styles.statValue}>{stats.wpm} WPM</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>detected fillers</span>
            <span className={styles.statValue}>{stats.detectedFillersCount}</span>
            <span className={styles.statNote}>
              {stats.fillersBreakdown.length > 0
                ? stats.fillersBreakdown.map((f) => `${f.type}: ${f.count}`).join(", ")
                : "none detected"}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>long pauses (&gt;1.5s)</span>
            <span className={styles.statValue}>{stats.longPausesCount}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>vocabulary variety</span>
            <span className={styles.statValue}>
              {Math.round(stats.vocabularyVarietyRatio * 100)}%
            </span>
            <span className={styles.statNote}>unique / total words</span>
          </div>
        </div>
      </section>

      {/* 3. Transcript with Flagged Mistake Highlighting */}
      <section className={styles.section} aria-labelledby="transcript-heading">
        <h3 id="transcript-heading" className={styles.sectionTitle}>
          transcript
        </h3>
        <div className={styles.transcriptBox}>{renderAnnotatedTranscript()}</div>
      </section>

      {/* 4. Corrections and Improvements */}
      {allCorrections.length > 0 && (
        <section className={styles.section} aria-labelledby="corrections-heading">
          <h3 id="corrections-heading" className={styles.sectionTitle}>
            corrections &amp; upgrades
          </h3>
          <div className={styles.correctionsList}>
            {allCorrections.map((item, idx) => (
              <div key={idx} className={styles.correctionRow}>
                <span className={styles.correctionIndex}>[{idx + 1}]</span>
                <div className={styles.correctionBody}>
                  <p className={styles.originalText}>{item.original}</p>
                  <p className={styles.improvedText}>&rarr; {item.improved}</p>
                  <p className={styles.reasonText}>{item.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Speech Structure & Poise */}
      <section className={styles.section} aria-labelledby="structure-heading">
        <h3 id="structure-heading" className={styles.sectionTitle}>
          structure &amp; poise
        </h3>
        <div className={styles.structureGrid}>
          <div className={styles.structureRow}>
            <span className={styles.structureLabel}>opening:</span>
            <span className={styles.structureDesc}>{feedback.structure?.opening}</span>
          </div>
          <div className={styles.structureRow}>
            <span className={styles.structureLabel}>body:</span>
            <span className={styles.structureDesc}>{feedback.structure?.body}</span>
          </div>
          <div className={styles.structureRow}>
            <span className={styles.structureLabel}>closing:</span>
            <span className={styles.structureDesc}>{feedback.structure?.closing}</span>
          </div>
          <div className={styles.structureRow}>
            <span className={styles.structureLabel}>confidence &amp; flow:</span>
            <span className={styles.structureDesc}>{feedback.confidence}</span>
          </div>
          <div className={styles.structureRow}>
            <span className={styles.structureLabel}>topic relevance:</span>
            <span className={styles.structureDesc}>{feedback.topicRelevance}</span>
          </div>
        </div>
      </section>

      {/* 6. Concrete Next Steps */}
      <section className={styles.section} aria-labelledby="next-steps-heading">
        <h3 id="next-steps-heading" className={styles.sectionTitle}>
          next practice actions
        </h3>
        <div className={styles.nextStepsList}>
          {feedback.nextSteps?.map((step, idx) => (
            <div key={idx} className={styles.stepRow}>
              <span className={styles.stepNum}>{idx + 1}.</span>
              <span className={styles.stepText}>{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onNewSession}
          disabled={isLimitReached}
          className={styles.primaryBtn}
        >
          [ new session ]
        </button>
        <Link href="/history" className={styles.historyLink}>
          [ view history ]
        </Link>
        {isLimitReached && (
          <span className={styles.limitMessage} role="status">
            daily limit reached, resets at midnight IST
          </span>
        )}
      </div>
    </div>
  );
}

