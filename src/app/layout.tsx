import type { Metadata } from "next";

import "./globals.css";
import ThemeProvider from "@/utilities/ThemeProvider";

export const metadata: Metadata = {
  title: "Pixecute",
  description: "Universal Pixel Art Editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`bg-neutral-500`}>
        <ThemeProvider attribute={"class"} defaultTheme={"dark"}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
