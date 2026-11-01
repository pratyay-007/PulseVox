"use client";

import { useEffect, useState } from "react";
import styles from "./DesktopOnlyGate.module.css";

interface DesktopOnlyGateProps {
  children: React.ReactNode;
}

export default function DesktopOnlyGate({ children }: DesktopOnlyGateProps) {
  const [isMobileDevice, setIsMobileDevice] = useState<boolean | null>(null);

  useEffect(() => {
    const checkIsMobileOrTablet = (): boolean => {
      // 1. User Agent Client Hints API
      const nav = navigator as Navigator & {
        userAgentData?: { mobile?: boolean };
      };
      if (nav.userAgentData?.mobile) {
        return true;
      }

      // 2. UA string regex for mobile/tablet devices
      const ua = navigator.userAgent || "";
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
        return true;
      }

      // 3. Pointer & hover query (coarse touch + no hover = phone/tablet)
      if (window.matchMedia && window.matchMedia("(pointer: coarse) and (hover: none)").matches) {
        return true;
      }

      return false;
    };

    const isMobile = checkIsMobileOrTablet();
    queueMicrotask(() => {
      setIsMobileDevice(isMobile);
    });
  }, []);

  const isBlockedByDevice = isMobileDevice === true;

  return (
    <div className={isBlockedByDevice ? styles.deviceBlocked : undefined}>
      <aside className={styles.gate} aria-label="Desktop requirement gate" role="alert">
        <div className={styles.content}>
          <div className={styles.prompt}>&gt; pulsevox</div>
          <p className={styles.message}>PulseVox needs a laptop or desktop.</p>
          <p className={styles.submessage}>Please open this page on a laptop or desktop computer.</p>
          {!isBlockedByDevice && (
            <p className={styles.widenHint}>If you are on a desktop, widen this window.</p>
          )}
        </div>
      </aside>

      <noscript>
        <div className={styles.gate} role="alert">
          <div className={styles.content}>
            <div className={styles.prompt}>&gt; pulsevox</div>
            <p className={styles.message}>PulseVox needs a laptop or desktop.</p>
            <p className={styles.submessage}>Please open this page on a laptop or desktop computer.</p>
            <p className={styles.widenHint}>If you are on a desktop, widen this window.</p>
          </div>
        </div>
      </noscript>

      {/* When device is known to be mobile/tablet, unmount children so microphone/flow never mounts */}
      <div className={styles.appContainer}>
        {isBlockedByDevice ? null : children}
      </div>
    </div>
  );
}
