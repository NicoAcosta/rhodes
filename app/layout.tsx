import type { Metadata, Viewport } from "next";
import { Playfair_Display, JetBrains_Mono, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-label",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Rhodes Keys",
  description:
    "Virtual Fender Rhodes Suitcase Piano — play classic electric piano sounds right in your browser.",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "Rhodes Keys",
    description:
      "Virtual Fender Rhodes Suitcase Piano — play classic electric piano sounds right in your browser.",
    url: appUrl,
    siteName: "Rhodes Keys",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Rhodes Keys — Virtual Electric Piano",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rhodes Keys",
    description:
      "Virtual Fender Rhodes Suitcase Piano — play classic electric piano sounds right in your browser.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d0d0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${jetbrains.variable} ${dmSans.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
