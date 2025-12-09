import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "You+ - Accountability Through Voice",
  description: "Nightly accountability calls to keep you honest with yourself",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-[#0D0D0D] text-[#FAFAFA] antialiased" style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
