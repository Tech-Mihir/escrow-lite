import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/lib/WalletContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Escrow Lite – Stellar dApp",
  description: "Decentralized escrow on Stellar Soroban",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white">
        <WalletProvider>
          <Navbar />
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
