import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rentle — Daily Apartment Value Game",
  description: "Every day, two real apartments. Which is better value? Vote, see the split, build your streak.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ctext y='50' x='50%25' text-anchor='middle' font-size='46'%3E%F0%9F%8F%A0%3C/text%3E%3C/svg%3E",
      },
    ],
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
      </body>
    </html>
  );
}
