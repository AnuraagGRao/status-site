import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anuraag's Status",
  description: "Live activity tracker — see what I'm up to right now.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-black">{children}</body>
    </html>
  );
}
