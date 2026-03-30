import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rentle — Daily Apartment Value Game",
  description: "Every day, two real apartments. Which is better value? Vote, see the split, build your streak.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Rentle",
    description: "Daily apartment value comparison game",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0f0f0f] text-white min-h-screen antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
