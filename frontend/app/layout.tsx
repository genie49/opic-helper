import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OPIc Helper - AI 기반 OPIc 학습 서비스",
  description: "AI 평가와 실시간 피드백으로 OPIc 점수를 향상시키세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${nunito.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
