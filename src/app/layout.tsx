import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undangan Pernikahan Naufal & Dilla",
  description: "Undangan Pernikahan Rifqi Naufal Gahara & Maghfira Tiara Adilla — 29 Desember 2026",
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
    description: "Selasa, 29 Desember 2026",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
