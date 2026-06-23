import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import { QueryProvider } from "./QueryProvider";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simulateur Crypto · S'investir",
  description:
    "Simulez l'évolution d'un investissement en cryptomonnaie sur données historiques réelles, en une fois ou en DCA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${lexend.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
