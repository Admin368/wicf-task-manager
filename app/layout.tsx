import type React from "react";
import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "@/components/toaster";
import { UserProvider } from "@/components/user-provider";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maravian Checklist",
  description: "Track team tasks in real-time",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <UserProvider>
            <Header />
            {children}
          </UserProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}

import "./globals.css";
