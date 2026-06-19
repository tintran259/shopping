import type { Metadata } from "next";
import { Inter, Montserrat, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/providers";
import { Header } from "@/components/layout/header/header";
import { Footer } from "@/components/layout/footer/footer";
import { BackToTop } from "@/components/shared/back-to-top";
import { getGlobalSeo, getActiveTheme } from "@/cms/services/cms.service";
import { themeToCssVars } from "@/cms/theme";
import { env } from "@/config/env";
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

const SITE_NAME = "Shopping";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getGlobalSeo();
  const title = seo?.title || `${SITE_NAME} — Headless Storefront`;
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: title, template: `%s · ${seo?.title || SITE_NAME}` },
    description:
      seo?.description ||
      "Headless ecommerce storefront built with Next.js and Strapi.",
    icons: seo?.favicon?.src ? { icon: seo.favicon.src } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getActiveTheme();
  const themeVars = theme ? themeToCssVars(theme) : undefined;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={themeVars}
      className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <BackToTop />
        </AppProviders>
      </body>
    </html>
  );
}
