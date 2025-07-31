import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import "./extension-hide.css";
import Providers from "./providers";
import FaviconGenerator from "@/components/FaviconGenerator";
import SimpleErrorBoundary from "@/components/SimpleErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});


export const metadata: Metadata = {
  title: "FableTech Studios",
  description: "Premium multimedia streaming platform",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
  },
  other: {
    'hide-extension-errors': '/hide-extension-errors.js'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="/hide-extension-errors.js" />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans antialiased`}
      >
        <SimpleErrorBoundary>
          <Providers>
            <FaviconGenerator />
            {children}
          </Providers>
        </SimpleErrorBoundary>
      </body>
    </html>
  );
}
