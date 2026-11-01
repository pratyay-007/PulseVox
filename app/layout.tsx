import type { Metadata } from "next";
import "./globals.css";
import DesktopOnlyGate from "@/components/DesktopOnlyGate";
import SessionBar from "@/components/SessionBar";

export const metadata: Metadata = {
  title: "PulseVox — AI English-Speaking Coach",
  description: "Desktop-only personal AI English-speaking coach. Daily speaking practice with real transcription and speech analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DesktopOnlyGate>
          <SessionBar />
          <main>{children}</main>
        </DesktopOnlyGate>
      </body>
    </html>
  );
}
