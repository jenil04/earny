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

const BASE_URL = 'https://earny.chat'

export const metadata: Metadata = {
  title: "Earny — Your Onchain CFO",
  description: "Find out how much you're leaving on the table every month. Earny reads your Base wallet and shows live earning opportunities across Compound, Aave, Morpho, Fluid, and Moonwell.",
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: '/earny-icon.jpg',
    apple: '/earny-icon.jpg',
  },
  openGraph: {
    title: 'Earny — Your Onchain CFO',
    description: "Find out how much you're leaving on the table every month.",
    url: BASE_URL,
    siteName: 'Earny',
    images: [{ url: '/earny-og.png', width: 1456, height: 816, alt: 'Earny — Your Earning Assistant' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Earny — Your Onchain CFO',
    description: "Find out how much you're leaving on the table every month.",
    images: ['/earny-og.png'],
  },
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
