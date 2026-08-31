import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import config from "../../status.config";

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
};

// Runs before paint to set the theme class, preventing a light/dark flash.
const NO_FLASH_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <div className="fixed right-4 top-4 z-40">
            <ThemeToggle />
          </div>
          <main className="min-h-screen">
            <Suspense fallback={<div>Loading...</div>}>
              {children}
            </Suspense>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
