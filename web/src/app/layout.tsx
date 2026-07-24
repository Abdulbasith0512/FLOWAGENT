import type { Metadata } from "next";
import localFont from "next/font/local";
import { Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const satoshi = localFont({
  variable: "--font-sans-stack",
  src: [
    { path: "../../public/fonts/satoshi-400.woff2", weight: "400" },
    { path: "../../public/fonts/satoshi-500.woff2", weight: "500" },
    { path: "../../public/fonts/satoshi-700.woff2", weight: "700" },
  ],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-stack",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "FlowAgent",
  description: "Visual AI workflow builder.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${satoshi.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
