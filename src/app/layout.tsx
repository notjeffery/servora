import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "SERVORA | Book trusted pros for any home job",
  description:
    "Painters, plumbers, HVAC technicians and more. See hourly rates upfront, pick your pro, and book in minutes.",
  openGraph: {
    title: "SERVORA | Book trusted pros for any home job",
    description:
      "See hourly rates upfront, pick your pro, and book in minutes.",
    siteName: "SERVORA",
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
      <body className={`${inter.className} bg-white text-gray-900`}>
        {children}
      </body>
    </html>
  );
}