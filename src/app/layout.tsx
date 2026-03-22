import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import AccentProvider from "@/components/AccentProvider";

export const metadata: Metadata = {
  title: "Card Trainer",
  description: "Master card games with math — minimal, precise, no fluff.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Card Trainer",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <AccentProvider />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
