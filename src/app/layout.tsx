import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineBanner } from "@/components/OfflineBanner";
import { RegisterSW } from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Parchi: a second opinion on every spray chit",
  description:
    "Photograph the pesticide dealer's chit. Parchi checks every product against India's official CIB&RC records and tells you, in your language, what is banned, off-label or overdosed.",
  applicationName: "Parchi",
  // Home-screen install on iPhone: full screen, paper status bar, short name under the icon.
  appleWebApp: {
    capable: true,
    title: "Parchi",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6efdf",
};

// Baloo has a sibling for each Indian script; Google Fonts serves only the glyph ranges a page uses.
const FONTS =
  "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Baloo+Bhai+2:wght@500;700&family=Baloo+Bhaina+2:wght@500;700&family=Baloo+Chettan+2:wght@500;700&family=Baloo+Da+2:wght@500;700&family=Baloo+Paaji+2:wght@500;700&family=Baloo+Tamma+2:wght@500;700&family=Baloo+Tammudu+2:wght@500;700&family=Baloo+Thambi+2:wght@500;700&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body className="min-h-full flex flex-col">
        <OfflineBanner />
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
