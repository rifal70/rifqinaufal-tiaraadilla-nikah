import type { Metadata } from "next";
import { getDynamicWeddingDate } from "@/lib/data";
import MediaMonitor from "@/components/MediaMonitor";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Great+Vibes&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <MediaMonitor />
      </body>
    </html>
  );
}