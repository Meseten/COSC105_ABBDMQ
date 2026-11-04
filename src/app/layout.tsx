import type { Metadata, Viewport } from "next";
import { Fraunces, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ChefDock from "@/components/ChefDock";
import MobileTabBar from "@/components/MobileTabBar";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "coci",
    template: "%s · coci",
  },
  description:
    "List the ingredients you already have, set a budget, and coci drafts a day-by-day meal plan plus a shopping list of what's missing.",
  applicationName: "coci",
  openGraph: {
    type: "website",
    siteName: "coci",
    title: "coci, your cocina buddy",
    description:
      "Plan palengke meals around what is actually in your kitchen, then share the board with your comares.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "coci" }],
  },
  twitter: {
    card: "summary",
    title: "coci, your cocina buddy",
    description:
      "Plan palengke meals around what is actually in your kitchen, then share the board with your comares.",
  },
  icons: {
    icon: [
      { url: "/favicon.png", media: "(prefers-color-scheme: light)" },
      { url: "/icons/icon-192.png" },
    ],
    apple: [{ url: "/icons/icon-512.png", sizes: "512x512" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // notches get real padding now that the chrome is fixed
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e5" },
    { media: "(prefers-color-scheme: dark)", color: "#201d15" },
  ],
};

const themeInit = `
(function(){
  try {
    var t = localStorage.getItem("pantrypal.theme");
    if (!t) t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${fraunces.variable} ${atkinson.variable} font-body`}>
        <a href="#pp-main" className="skip-link">
          Skip to main content
        </a>
        {children}
        <MobileTabBar />
        <ChefDock />
        <Analytics />
        <SpeedInsights />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "4px",
              fontSize: "0.9rem",
            },
          }}
        />
      </body>
    </html>
  );
}
