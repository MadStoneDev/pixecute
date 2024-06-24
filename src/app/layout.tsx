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
      <body
        className={`relative flex flex-col items-center justify-start w-full h-dvh bg-neutral-900 overflow-hidden`}
        style={{
          backgroundImage: "url(/home_bg.jpg)",
          backgroundSize: "cover",
        }}
      >
        <div
          className={`absolute top-0 left-0 w-full h-full bg-neutral-100/20 dark:bg-neutral-900/50 -z-10`}
        ></div>
        <ThemeProvider attribute={"class"} defaultTheme={"dark"}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
