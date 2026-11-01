import Link from "next/link";
import styles from "./page.module.css";

// No more figlet ASCII — using normal bold text instead

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* Yellow Hero Poster with Overlapping Strips */}
      <section className={styles.heroPoster} aria-labelledby="hero-title">
        <div className={styles.posterHeader}>
          <div className={styles.wordmarkContainer}>
            <span className={styles.wordmark} aria-hidden="true">
              PULSEVOX
            </span>
            <div className={styles.brandSubstrip}>
              <span>PERSONAL AI ENGLISH COACH</span>
            </div>
          </div>
          <Link
            href="/about"
            className={styles.redArrowTile}
            title="About PulseVox &amp; Author"
            aria-label="About PulseVox and Author"
          >
            ➔
          </Link>
        </div>

        <h1 id="hero-title" className="sr-only">
          PulseVox — Personal AI English-Speaking Coach
        </h1>

        {/* Overlapping Headline Strips */}
        <div className={styles.statementStrips}>
          <div className={styles.stripBlack}>
            <span>REAL SPEAKING PRACTICE</span>
          </div>
          <div className={styles.stripCream}>
            <span>WITH DAILY TOPICS &amp; TIMED PRESSURE</span>
          </div>
          <div className={styles.stripWhite}>
            <span>AND HONEST AI FEEDBACK</span>
          </div>
        </div>

        {/* Violet band beneath holding explanation and actions */}
        <div className={styles.violetBand}>
          <p className={styles.description}>
            Choose from 10 genres refreshed daily. Prepare your thoughts, speak into your microphone,
            and get instant corrections on grammar, vocabulary upgrades, detected fillers, and speaking pace.
          </p>

          <div className={styles.heroActions}>
            <Link href="/practice?reset=1" className={styles.startButton}>
              [ start ]
            </Link>
            <span className={styles.actionBadge}>3 DAILY SESSIONS · FREE · NO SIGN-UP</span>
          </div>
        </div>

        {/* Ruled Ledger: Key Session Parameters */}
        <div className={styles.factsLedger} aria-label="Key session parameters">
          <div className={styles.factCard}>
            <span className={styles.factKey}>topics</span>
            <span className={styles.factValue}>50 new every day</span>
          </div>
          <div className={styles.factCard}>
            <span className={styles.factKey}>prep</span>
            <span className={styles.factValue}>5–15 min</span>
          </div>
          <div className={styles.factCard}>
            <span className={styles.factKey}>speak</span>
            <span className={styles.factValue}>2–5 min</span>
          </div>
          <div className={styles.factCard}>
            <span className={styles.factKey}>feedback</span>
            <span className={styles.factValue}>grammar, vocabulary, fillers, pace</span>
          </div>
        </div>
      </section>

      {/* How It Works Section: Numbered Paper Steps */}
      <section className={styles.section} aria-labelledby="how-it-works-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleStrip}>
            <h2 id="how-it-works-heading" className={styles.sectionTitle}>
              how it works
            </h2>
          </div>
          <span className={styles.sectionAnnotation}>RULED WORKFLOW · STEP BY STEP</span>
        </div>

        <div className={styles.stepsList}>
          <div className={styles.stepItem}>
            <div className={styles.stepNumberBadge}>01</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>choose genres</span>
              <p className={styles.stepDesc}>Select from 10 diverse categories or pick all</p>
            </div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumberBadge}>02</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>choose topic</span>
              <p className={styles.stepDesc}>Spin the slot reel for today&apos;s curated speaking prompt</p>
            </div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumberBadge}>03</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>prepare</span>
              <p className={styles.stepDesc}>5–15 min prep countdown with hints &amp; private browser notes</p>
            </div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumberBadge}>04</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>speak</span>
              <p className={styles.stepDesc}>2–5 min recorded speech with live audio level check</p>
            </div>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumberBadge}>05</div>
            <div className={styles.stepContent}>
              <span className={styles.stepTitle}>feedback</span>
              <p className={styles.stepDesc}>Speech-to-text transcript, filler metrics &amp; grammar upgrades</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section: Ruled Ledger Disclosures */}
      <section className={styles.section} aria-labelledby="faq-heading">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleStripViolet}>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              frequently asked questions
            </h2>
          </div>
          <span className={styles.sectionAnnotation}>HONEST ANSWERS · ZERO FLUFF</span>
        </div>

        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary className={styles.faqSummary}>
              <span className={styles.faqQuestion}>Do I need an account or login?</span>
              <span className={styles.faqIconBox} aria-hidden="true">
                +
              </span>
            </summary>
            <p className={styles.faqAnswer}>
              No. PulseVox requires no login, no password, and no registration. You can start practicing immediately.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqSummary}>
              <span className={styles.faqQuestion}>Is my audio saved or uploaded anywhere?</span>
              <span className={styles.faqIconBox} aria-hidden="true">
                +
              </span>
            </summary>
            <p className={styles.faqAnswer}>
              No. Your audio is processed directly in memory for transcription and speech metrics, then immediately discarded. We never store voice recordings.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqSummary}>
              <span className={styles.faqQuestion}>How many sessions can I practice each day?</span>
              <span className={styles.faqIconBox} aria-hidden="true">
                +
              </span>
            </summary>
            <p className={styles.faqAnswer}>
              Each device gets 3 completed sessions per day. The limit resets at midnight IST (Asia/Kolkata).
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqSummary}>
              <span className={styles.faqQuestion}>Where is my practice history kept?</span>
              <span className={styles.faqIconBox} aria-hidden="true">
                +
              </span>
            </summary>
            <p className={styles.faqAnswer}>
              History is saved entirely in your browser&apos;s local storage. It never leaves your computer. Clearing site cookies or data clears your local history.
            </p>
          </details>

          <details className={styles.faqItem}>
            <summary className={styles.faqSummary}>
              <span className={styles.faqQuestion}>Why is PulseVox desktop and laptop only?</span>
              <span className={styles.faqIconBox} aria-hidden="true">
                +
              </span>
            </summary>
            <p className={styles.faqAnswer}>
              PulseVox is built for focused speech practice on desktop environments with stable keyboards, reliable microphones, and full viewports.
            </p>
          </details>
        </div>
      </section>

      {/* Closing Poster on Red Field */}
      <section className={styles.closingField} aria-label="Get started callout">
        <div className={styles.closingPoster}>
          <div className={styles.closingHeader}>
            <span className={styles.closingEyebrow}>START PRACTISING TODAY</span>
            <h3 className={styles.closingTitle}>REAL SPOKEN ENGLISH FEEDBACK</h3>
          </div>
          <p className={styles.closingDesc}>
            Prep your thoughts, speak into your mic, and see clear corrections for grammar, vocabulary, fillers, and pace.
          </p>
          <div className={styles.closingAction}>
            <Link href="/practice?reset=1" className={styles.closingBtn}>
              [ start practice ]
            </Link>
          </div>
        </div>
      </section>

      {/* Directory-Style Grouped Footer */}
      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerGroup}>
          <div className={styles.footerBrand}>PULSEVOX</div>
          <p className={styles.footerNote}>
            PulseVox — 100% free personal AI English-speaking coach. All data resets daily at midnight IST.
          </p>
        </div>
        <nav className={styles.footerNav} aria-label="Footer directory">
          <Link href="/practice?reset=1" className={styles.footerLink}>
            [ practice ]
          </Link>
          <Link href="/history" className={styles.footerLink}>
            [ history ]
          </Link>
          <Link href="/about" className={styles.footerLink}>
            [ about ]
          </Link>
        </nav>
      </footer>
    </div>
  );
}
