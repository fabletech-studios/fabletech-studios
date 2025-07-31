import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import FaviconGenerator from "@/components/FaviconGenerator";
import NavigationFix from "@/components/NavigationFix";
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
      { url: '/api/favicon', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
