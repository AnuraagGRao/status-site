import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Status",
  description: "Live activity tracker — see what I'm up to right now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="stylesheet" href="https://facet.tanishksharma.com/lib/facet.css" />
      </head>
      <body className="min-h-full bg-black">{children}</body>
      <Script src="https://facet.tanishksharma.com/lib/facet.js" defer />
    </html>
  );
}
