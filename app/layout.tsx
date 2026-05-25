// Layout racine Axso — chargement des fonts premium
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Axso — Ta boutique en ligne en 3 minutes",
    template: "%s | Axso",
  },
  description:
    "Crée ta boutique en ligne en 3 minutes. 100% gratuit, 3% par vente seulement. Paiements Mobile Money, Orange Money, Wave, carte bancaire.",
  keywords: ["e-commerce", "boutique en ligne", "mobile money", "vendre en ligne", "axso"],
  openGraph: {
    title: "Axso — Ta boutique en ligne en 3 minutes",
    description: "Crée ta boutique en ligne, vends partout, encaisse facilement.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
