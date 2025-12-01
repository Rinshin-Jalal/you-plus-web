import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
