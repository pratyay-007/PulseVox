import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: "About PulseVox — Architecture, Privacy & Author",
  description:
    "Learn about PulseVox, our speech coaching architecture, privacy policy, user agreement, and creator Pratyay Hazra.",
};

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <section className={styles.row} aria-label="About PulseVox">
        <h2 className={styles.gutter}>&gt; about</h2>

        <div className={styles.output}>
          {/* Header Banner */}
          <div className={styles.headerBanner}>
            <span className={styles.eyebrow}>ARCHITECTURE · TERMS · PRIVACY · AUTHOR</span>
            <h1 className={styles.pageTitle}>ABOUT PULSEVOX</h1>
            <p className={styles.leadText}>
              A 100% free, desktop-first personal AI English coach designed to help anyone speak
              confidently with timed pressure, daily topics, and honest AI feedback.
            </p>
          </div>

          {/* 1. What PulseVox Is & Architecture */}
          <section className={styles.cardSection}>
            <div className={styles.sectionTitleStrip}>
              <h2 className={styles.sectionHeading}>01 · THE SYSTEM ARCHITECTURE</h2>
            </div>
            <p className={styles.bodyText}>
              PulseVox is built around a real, non-mocked AI speech analysis pipeline designed
              specifically for spoken English practice. Rather than generic scores or arbitrary
              grades, it provides actionable, itemized coaching:
            </p>

            <div className={styles.ledgerGrid}>
              <div className={styles.ledgerCard}>
                <span className={styles.ledgerKey}>SPEECH-TO-TEXT</span>
                <span className={styles.ledgerVal}>
                  Groq Whisper (<code>whisper-large-v3-turbo</code>) with word-level timestamps and
                  hesitation preservation to detect natural speech flow.
                </span>
              </div>
              <div className={styles.ledgerCard}>
                <span className={styles.ledgerKey}>STATISTICAL ENGINE</span>
                <span className={styles.ledgerVal}>
                  Deterministic code computes word count, words per minute (WPM), hesitation fillers
                  (um, uh, you know, actually, like), long pauses (&gt;1.5s), and vocabulary diversity.
                </span>
              </div>
              <div className={styles.ledgerCard}>
                <span className={styles.ledgerKey}>COACHING LLM</span>
                <span className={styles.ledgerVal}>
                  Groq LLM identifies exact grammatical errors with corrections, suggests vocabulary
                  upgrades, analyzes structure &amp; poise, and provides 3 concrete practice actions.
                </span>
              </div>
              <div className={styles.ledgerCard}>
                <span className={styles.ledgerKey}>DAILY TOPIC POOL</span>
                <span className={styles.ledgerVal}>
                  50 fresh topics across 10 genres generated every day at midnight IST, with
                  current-affairs grounded in live RSS headlines from reputable world news sources.
                </span>
              </div>
            </div>
          </section>

          {/* 2. User Agreement & Terms of Service */}
          <section className={styles.cardSection}>
            <div className={styles.sectionTitleStrip}>
              <h2 className={styles.sectionHeading}>02 · USER AGREEMENT &amp; TERMS</h2>
            </div>
            <div className={styles.termsList}>
              <div className={styles.termItem}>
                <span className={styles.termIndex}>[A]</span>
                <div>
                  <h3 className={styles.termTitle}>Free Educational &amp; Practice Tool</h3>
                  <p className={styles.termBody}>
                    PulseVox is free to use for personal speaking practice, interview prep, and
                    language self-improvement. No subscriptions, credit cards, or accounts are
                    required.
                  </p>
                </div>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termIndex}>[B]</span>
                <div>
                  <h3 className={styles.termTitle}>3 Sessions Per Day Limit</h3>
                  <p className={styles.termBody}>
                    To keep the service 100% free and sustainable for everyone, each device receives
                    up to 3 completed practice sessions per day. Counters reset automatically every
                    midnight IST (Asia/Kolkata).
                  </p>
                </div>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termIndex}>[C]</span>
                <div>
                  <h3 className={styles.termTitle}>Desktop &amp; Laptop Only</h3>
                  <p className={styles.termBody}>
                    PulseVox is engineered strictly for desktop and laptop environments where users
                    have stable microphone inputs, reliable keyboards for notes, and full viewports
                    without mobile distractions.
                  </p>
                </div>
              </div>
              <div className={styles.termItem}>
                <span className={styles.termIndex}>[D]</span>
                <div>
                  <h3 className={styles.termTitle}>AI Feedback Disclaimer</h3>
                  <p className={styles.termBody}>
                    Coaching insights and corrections are generated by artificial intelligence for
                    educational self-guidance. They do not constitute official academic certification
                    or formal language testing (e.g. IELTS/TOEFL).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Privacy Policy */}
          <section className={styles.cardSection}>
            <div className={styles.sectionTitleStrip}>
              <h2 className={styles.sectionHeading}>03 · PRIVACY POLICY</h2>
            </div>

            <div className={styles.privacyHighlights}>
              <div className={styles.privacyBox}>
                <span className={styles.privacyIcon}>🔒</span>
                <div>
                  <h3 className={styles.privacyTitle}>Zero Voice Recording Storage</h3>
                  <p className={styles.privacyDesc}>
                    Your microphone audio is streamed strictly in-memory directly to transcription,
                    evaluated, and immediately discarded. <strong>We never record, save, store, or sell
                    your voice recordings.</strong>
                  </p>
                </div>
              </div>

              <div className={styles.privacyBox}>
                <span className={styles.privacyIcon}>💻</span>
                <div>
                  <h3 className={styles.privacyTitle}>Local-Only Practice History</h3>
                  <p className={styles.privacyDesc}>
                    Your previous practice transcripts and metrics are saved exclusively in your
                    browser&apos;s <code>localStorage</code>. They never leave your machine and are not
                    sent to any remote database. Clearing your browser cache removes them.
                  </p>
                </div>
              </div>

              <div className={styles.privacyBox}>
                <span className={styles.privacyIcon}>🛡️</span>
                <div>
                  <h3 className={styles.privacyTitle}>No Accounts, No Trackers, No Ads</h3>
                  <p className={styles.privacyDesc}>
                    No email addresses, phone numbers, or passwords. We do not use third-party analytics
                    trackers or ad pixels. An anonymous, cryptographically signed cookie is used solely
                    to enforce the daily 3-session fair use cap.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. About the Author */}
          <section className={styles.authorSection}>
            <div className={styles.authorHeader}>
              <span className={styles.authorEyebrow}>CREATOR &amp; DEVELOPER</span>
              <h2 className={styles.authorName}>PRATYAY HAZRA</h2>
              <p className={styles.authorBio}>
                PulseVox was designed and built by <strong>Pratyay Hazra</strong>, an enthusiastic student
                developer and vibe coder. Frustrated by language learning apps that gate honest spoken
                feedback behind paywalls, sign-ups, and arbitrary game-like point systems, Pratyay
                created PulseVox as a focused, free, and completely transparent speaking gym.
              </p>
            </div>

            <div className={styles.authorLinksGrid}>
              <a
                href="https://www.linkedin.com/in/pratyay-hazra"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.authorLinkCard}
              >
                <div className={styles.linkHeader}>
                  <span className={styles.linkPlatform}>LINKEDIN</span>
                  <span className={styles.linkArrow}>↗</span>
                </div>
                <span className={styles.linkHandle}>/in/pratyay-hazra</span>
                <span className={styles.linkAction}>Connect on LinkedIn &rarr;</span>
              </a>

              <a
                href="https://github.com/pratyay-007"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.authorLinkCardGithub}
              >
                <div className={styles.linkHeader}>
                  <span className={styles.linkPlatform}>GITHUB</span>
                  <span className={styles.linkArrow}>↗</span>
                </div>
                <span className={styles.linkHandle}>@pratyay-007</span>
                <span className={styles.linkAction}>Explore repositories &rarr;</span>
              </a>
            </div>
          </section>

          {/* Return button */}
          <div className={styles.actions}>
            <Link href="/practice?reset=1" className={styles.primaryBtn}>
              [ start practice ]
            </Link>
            <Link href="/" className={styles.secondaryBtn}>
              [ back to home ]
            </Link>
          </div>
        </div>

        {/* Right-side spacer to keep .output perfectly centered */}
        <div className={styles.gutterSpacer} aria-hidden="true" />
      </section>
    </div>
  );
}

