import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import { AuthProvider } from "@/contexts/AuthContext";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CADeala Gift Cards",
  description: "Your trusted gift card platform - Buy, sell, and manage gift cards with ease",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CADeala",
  },
  formatDetection: {
    telephone: false,
  },
  // PWA meta tags
  applicationName: "CADeala",
  authors: [{ name: "CADeala Team" }],
  generator: "Next.js",
  keywords: ["gift cards", "business", "finance", "shopping"],
  referrer: "origin-when-cross-origin",
  colorScheme: "light",
  creator: "CADeala",
  publisher: "CADeala",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "CADeala Gift Cards",
    description: "Your trusted gift card platform",
    url: "https://cadeala.com",
    siteName: "CADeala",
    images: [
      {
        url: "/CADEALA LOGO.png",
        width: 512,
        height: 512,
        alt: "CADeala Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CADeala Gift Cards",
    description: "Your trusted gift card platform",
    images: ["/CADEALA LOGO.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f27921",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Mobile Icon.png" />
        <link rel="shortcut icon" href="/Mobile Icon.png" />
        <link rel="apple-touch-icon" href="/Mobile Icon.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/Mobile Icon.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/Mobile Icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CADeala" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#f27921" />
        <meta name="msapplication-TileColor" content="#f27921" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
