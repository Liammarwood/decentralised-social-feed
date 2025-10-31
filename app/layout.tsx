import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Decentralized Social Feed",
  description: "A decentralized, local-first social media PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Decentralized Social",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1976d2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Navigation />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
