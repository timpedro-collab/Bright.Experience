import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://experience.brightblue.com"
  ),
  title: {
    default: "Bright.Experience — Premium activation platform",
    template: "%s · Bright.Experience",
  },
  description:
    "End-to-end delivery, booking, and reporting platform for Bright.Blue interactive activations.",
  applicationName: "Bright.Experience",
  authors: [{ name: "Bright.Blue Events" }],
  keywords: [
    "interactive activations",
    "experiential marketing",
    "event technology",
    "Bright.Blue",
  ],
  openGraph: {
    title: "Bright.Experience",
    description:
      "Premium booking, delivery, and reporting platform for Bright.Blue interactive activations.",
    type: "website",
    siteName: "Bright.Experience",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bright.Experience",
    description:
      "Premium booking, delivery, and reporting platform for Bright.Blue interactive activations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d29",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;550;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
