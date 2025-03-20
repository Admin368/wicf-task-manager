import type React from "react";
import "@/app/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { UserProvider } from "@/components/user-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";
import { Toaster as SonnerToaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://checklist.maravian.com"),
  title: "Maravian Checklist",
  description:
    "Realtime collaborative checklist for teams and individual on recurring tasks of event plan execution",
  icons: {
    icon: "https://maravianwebservices.com/images/photos/maravian/favicon.png", // For browsers
    apple:
      "https://maravianwebservices.com/images/photos/maravian/apple-touch-icon.png", // Apple devices
    shortcut:
      "https://maravianwebservices.com/images/photos/maravian/favicon-32x32.png", // Optional shortcut icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex flex-col min-h-full`}>
        <Toaster />
        <SonnerToaster />
        <Providers>
          <UserProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
