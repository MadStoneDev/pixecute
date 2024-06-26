import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/utils/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pixecute | The Universal Pixel Art Creator",
  description: "Make pixel art on the go with Pixecute",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`relative flex flex-col items-center justify-start w-full h-dvh overflow-hidden`}
      >
        <ThemeProvider attribute={"class"} defaultTheme={"dark"}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
