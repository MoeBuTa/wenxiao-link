import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wenxiao.link"),
  title: {
    default: "Wenxiao Zhang",
    template: "%s · Wenxiao Zhang",
  },
  description:
    "Wenxiao Zhang — PhD candidate in Computer Science at UWA researching reliable and secure LLM agent systems; AI engineer and data scientist.",
  openGraph: {
    title: "Wenxiao Zhang",
    description:
      "PhD candidate in Computer Science at UWA · AI Engineer · Data Scientist",
    url: "https://wenxiao.link",
    siteName: "Wenxiao Zhang",
    images: ["/avatar.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>
        <Providers>
          <SiteHeader />
          <main style={{ minHeight: "80vh" }}>{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
