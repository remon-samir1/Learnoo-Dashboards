import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://learnoo.app"),
  title: "Learnoo-Dashboard",
  description: "Learnoo-Dashboard",
  icons: {
    icon: [
      { url: "/icon?v=20261023", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon?v=20261023",
  },
  openGraph: {
    images: [
      {
        url: "/Logo.jpeg?v=20261023",
        width: 1097,
        height: 1078,
        alt: "Learnoo Logo",
      },
    ],
  },
  twitter: {
    images: ["/Logo.jpeg?v=20261023"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const pathLocale = headerStore.get("x-learnoo-locale");
  const cookieLocale = cookieStore.get("locale")?.value;

  const locale =
    pathLocale === "ar" || pathLocale === "en"
      ? pathLocale
      : cookieLocale === "ar" || cookieLocale === "en"
        ? cookieLocale
        : "en";

  const isRTL = locale === "ar";

  const messages =
    locale === "ar"
      ? (await import("../messages/ar.json")).default
      : (await import("../messages/en.json")).default;

  return (
    <html
      lang={locale}
      dir={isRTL ? "rtl" : "ltr"}
      className={`geist-sans geist-mono`}
    >
      {/* Extensions (e.g. ColorZilla: cz-shortcut-listen) mutate <body> before hydration */}
      <body suppressHydrationWarning>
        <Providers
          messages={messages as unknown as Record<string, unknown>}
          locale={locale}
        >
        <Toaster />
          {children}
        </Providers>
      </body>
    </html>
  );
}
