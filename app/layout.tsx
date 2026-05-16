import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Learnoo-Dashboard",
  description: "Learnoo-Dashboard",
  icons: {
    icon: [
      { url: "/Logo.jpeg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: "/Logo.jpeg",
  },
  openGraph: {
    images: [
      {
        url: "/Logo.jpeg",
        width: 512,
        height: 512,
        alt: "Learnoo Logo",
      },
    ],
  },
  twitter: {
    images: ["/Logo.jpeg"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;

  const locale =
    cookieLocale === "ar" || cookieLocale === "en" ? cookieLocale : "en";

  const isRTL = locale === "ar";

  const messages =
    locale === "ar"
      ? (await import("../messages/ar.json")).default
      : (await import("../messages/en.json")).default;

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      {/* Extensions (e.g. ColorZilla: cz-shortcut-listen) mutate <body> before hydration */}
      <body suppressHydrationWarning>
        <Providers messages={messages} locale={locale}>
        <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
