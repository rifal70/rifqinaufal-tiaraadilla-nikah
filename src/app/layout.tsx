import type { Metadata } from "next";
import { getDynamicWeddingDate } from "@/lib/data";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { dateText } = await getDynamicWeddingDate();

  return {
    title: "Undangan Pernikahan Naufal & Dilla",
    description: `Undangan Pernikahan Rifqi Naufal Gahara & Maghfira Tiara Adilla — ${dateText}`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
    openGraph: {
      title: "Undangan Pernikahan Naufal & Dilla",
      description: dateText,
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}