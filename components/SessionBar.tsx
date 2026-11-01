"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SessionBar.module.css";

export const REFRESH_USAGE_EVENT = "pulsevox:refresh-usage";
export const NEW_SESSION_EVENT = "pulsevox:new-session";

export default function SessionBar() {
  const [statusText, setStatusText] = useState<string>("trials left today: …");
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    async function fetchUsage() {
      try {
        const res = await fetch("/api/usage", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to fetch usage");
        }
        const data = await res.json();
        if (!isMounted) return;

        if (data.capacityFull) {
          setStatusText("today's free capacity is full");
        } else if (typeof data.remaining === "number" && data.remaining <= 0) {
          setStatusText("daily limit reached, resets at midnight IST");
        } else if (typeof data.remaining === "number" && typeof data.limit === "number") {
          setStatusText(`trials left today: ${data.remaining}/${data.limit}`);
        } else {
          setStatusText("trials left today: unavailable");
        }
      } catch {
        if (isMounted) {
          setStatusText("trials left today: unavailable");
        }
      }
    }

    fetchUsage();

    const handleRefresh = () => {
      fetchUsage();
    };

    window.addEventListener(REFRESH_USAGE_EVENT, handleRefresh);
    return () => {
      isMounted = false;
      window.removeEventListener(REFRESH_USAGE_EVENT, handleRefresh);
    };
  }, []);

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <Link href="/" className={styles.brandLink}>
          <span>PULSEVOX</span>
          <span className={styles.cursor} aria-hidden="true">
            █
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Main Navigation">
          <Link
            href="/practice?reset=1"
            className={styles.navLink}
            onClick={(e) => {
              if (pathname === "/practice") {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent(NEW_SESSION_EVENT));
              }
            }}
          >
            [ practice ]
          </Link>
          <Link href="/history" className={styles.navLink}>
            [ history ]
          </Link>
          <Link href="/about" className={styles.navLink}>
            [ about ]
          </Link>
        </nav>
      </div>

      <div className={styles.right} role="status" aria-live="polite">
        <span>{statusText}</span>
      </div>
    </header>
  );
}
