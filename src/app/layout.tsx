import type { Metadata } from "next";
import { Inter, Montserrat, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/providers";
import "./globals.css";

// Body / UI font — Inter is the most widely used e-commerce UI font; great at
// small sizes and includes a Vietnamese subset.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// Heading / brand font — Montserrat is a popular e-commerce display font and
// also ships a Vietnamese subset.
const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Shopping — Headless Storefront",
    template: "%s · Shopping",
  },
  description: "Headless ecommerce storefront built with Next.js and Strapi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
