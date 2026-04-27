import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Moosa Ministry — Korean ASMR Cravings, Served Hot",
  description:
    "Pan-Asian & Korean street food in Gulshan-e-Maymar, Karachi. Live hotpot, ASMR noodles, dumplings, gimbap and more.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Moosa Ministry",
    description: "Korean ASMR Cravings — Served Hot.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSerifKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(20,17,15,0.95)",
              color: "#f5f0dc",
              border: "1px solid rgba(245,240,220,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
