import type { Metadata } from "next";
import { Funnel_Display, Funnel_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const funnelSans = Funnel_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const funnelDisplay = Funnel_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Earny — Your Onchain CFO",
  description: "Find out how much you're leaving on the table every month.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${funnelSans.variable} ${funnelDisplay.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
