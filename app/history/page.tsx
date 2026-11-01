"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HistorySession,
  getHistorySessions,
  deleteHistorySession,
  clearAllHistory,
} from "@/lib/history";
import Results from "@/components/Results";
import styles from "./page.module.css";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null);

  const loadSessions = () => {
    setSessions(getHistorySessions());
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSessions();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = (id: string) => {
    deleteHistorySession(id);
    loadSessions();
    if (selectedSession?.id === id) {
      setSelectedSession(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all local practice history?")) {
      clearAllHistory();
      loadSessions();
      setSelectedSession(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
    } catch {
      return isoString.slice(0, 10);
    }
  };

  // Build character trend bars (████░░░░ 12)
  const renderTrendBar = (value: number, maxExpected: number) => {
    const totalSlots = 8;
    const ratio = Math.min(1, Math.max(0, value / (maxExpected || 1)));
    const filled = Math.round(ratio * totalSlots);
    const empty = totalSlots - filled;
    return `${"█".repeat(filled)}${"░".repeat(empty)}`;
  };

  // Recent 5 sessions for trend charts (in chronological order)
  const recentSessionsChronological = [...sessions].slice(0, 5).reverse();

  return (
    <div className={styles.container}>
      <section className={styles.row}>
        <h2 className={styles.gutter}>&gt; history</h2>

        <div className={styles.output}>
          <p className={styles.noticeBar}>
            History is saved only in this browser. Clearing site data deletes it.
          </p>

          {/* Detailed view of single opened result */}
          {selectedSession ? (
            <div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className={styles.backBtn}
              >
                [ &larr; back to all sessions ]
              </button>
              <Results result={selectedSession} onNewSession={() => setSelectedSession(null)} />
            </div>
          ) : (
            <>
              {/* Trends Section (real data only) */}
              {sessions.length > 0 && (
                <div className={styles.trendSection}>
                  <h3 className={styles.sectionTitle}>performance trends</h3>

                  {/* Pace Trend */}
                  <div className={styles.trendItem}>
                    <span className={styles.trendLabel}>speaking pace (WPM over recent sessions):</span>
                    <div className={styles.trendRows}>
                      {recentSessionsChronological.map((s) => (
                        <div key={`wpm-${s.id}`} className={styles.trendRow}>
                          <span className={styles.trendDate}>{formatDate(s.date)}</span>
                          <span className={styles.trendBar} aria-hidden="true">
                            {renderTrendBar(s.stats.wpm, 200)}
                          </span>
                          <span className={styles.trendVal}>{s.stats.wpm} WPM</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fillers per minute Trend */}
                  <div className={styles.trendItem}>
                    <span className={styles.trendLabel}>detected fillers / min:</span>
                    <div className={styles.trendRows}>
                      {recentSessionsChronological.map((s) => {
                        const mins = Math.max(0.2, s.durationSec / 60);
                        const rate = Math.round((s.stats.detectedFillersCount / mins) * 10) / 10;
                        return (
                          <div key={`fillers-${s.id}`} className={styles.trendRow}>
                            <span className={styles.trendDate}>{formatDate(s.date)}</span>
                            <span className={styles.trendBar} aria-hidden="true">
                              {renderTrendBar(rate, 15)}
                            </span>
                            <span className={styles.trendVal}>{rate} / min</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Sessions List */}
              <div className={styles.sessionsList}>
                <div className={styles.listHeader}>
                  <h3 className={styles.sectionTitle}>saved sessions ({sessions.length})</h3>
                  {sessions.length > 0 && (
                    <button type="button" onClick={handleClearAll} className={styles.deleteAllBtn}>
                      [ delete all ]
                    </button>
                  )}
                </div>

                {sessions.length === 0 ? (
                  <p className={styles.emptyState}>
                    No sessions recorded yet. Start a{" "}
                    <Link href="/practice" style={{ textDecoration: "underline" }}>
                      practice session
                    </Link>{" "}
                    to receive feedback and track your progress.
                  </p>
                ) : (
                  sessions.map((s) => (
                    <article key={s.id} className={styles.sessionItem}>
                      <div className={styles.sessionMain}>
                        <span className={styles.sessionTopic}>{s.topicTitle}</span>
                        <div className={styles.sessionActions}>
                          <button
                            type="button"
                            onClick={() => setSelectedSession(s)}
                            className={styles.actionBtn}
                          >
                            [ open ]
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            className={styles.actionBtn}
                          >
                            [ delete ]
                          </button>
                        </div>
                      </div>
                      <div className={styles.sessionMeta}>
                        <span>{formatDate(s.date)}</span>
                        <span>{s.stats.wordCount} words</span>
                        <span>{s.stats.wpm} WPM</span>
                        <span>{s.stats.detectedFillersCount} detected fillers</span>
                        <span>{s.durationSec}s duration</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Right-side spacer to keep .output perfectly centered */}
        <div className={styles.gutterSpacer} aria-hidden="true" />
      </section>
    </div>
  );
}
