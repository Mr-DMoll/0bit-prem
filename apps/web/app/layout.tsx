import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/shared/context/AuthContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { ConfirmProvider } from "@/shared/context/ConfirmContext";
import { ToastProvider } from "@/shared/context/ToastContext";

const inter = Inter({
  subsets: ["latin"],
  // Variable font: one file covers every weight instead of five separate downloads.
  variable: "--font-inter",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Premvkay",
  description: "Premvkay's own streaming and merch platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorantGaramond.variable}`}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ConfirmProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </ConfirmProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
